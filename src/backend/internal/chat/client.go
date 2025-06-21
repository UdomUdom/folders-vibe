package chat

import (
	"bytes"
	"context"
	"encoding/json"
	"log"
	"msgtext/backend/internal/db"
	"msgtext/backend/internal/models"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 1024 * 1024 // 1MB, adjust as needed, especially for media
)

var (
	newline = []byte{'\n'}
	space   = []byte{' '}
)

// Client is a middleman between the websocket connection and the hub.
type Client struct {
	hub *Hub

	// The websocket connection.
	conn *websocket.Conn

	// Buffered channel of outbound messages.
	send chan []byte

	// UserID of the connected user
	userID int64
}

// NewClient creates a new client.
func NewClient(hub *Hub, conn *websocket.Conn, userID int64) *Client {
	return &Client{
		hub:    hub,
		conn:   conn,
		send:   make(chan []byte, 256), // Buffer size 256
		userID: userID,
	}
}

// readPump pumps messages from the websocket connection to the hub.
//
// The application runs readPump in a per-connection goroutine. The application
// ensures that there is at most one reader on a connection by executing all
// reads from this goroutine.
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
		log.Printf("Closed WebSocket connection and unregistered client: UserID %d, RemoteAddr: %s", c.userID, c.conn.RemoteAddr())
	}()
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })

	for {
		messageType, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Unexpected WebSocket close error: %v. UserID: %d", err, c.userID)
			} else {
				log.Printf("WebSocket read error: %v. UserID: %d", err, c.userID)
			}
			break // Exit loop on error
		}

		// Process only text messages for now, binary messages can be for files later
		if messageType == websocket.TextMessage {
			message = bytes.TrimSpace(bytes.Replace(message, newline, space, -1))
			log.Printf("Received message from UserID %d: %s", c.userID, message)

			// Attempt to parse the message into our models.Message structure
			var msg models.Message
			if err := json.Unmarshal(message, &msg); err != nil {
				log.Printf("Error unmarshalling message from UserID %d: %v. Message: %s", c.userID, err, message)
				// Optionally send an error message back to the client
				// c.send <- []byte(`{"error": "Invalid message format"}`)
				continue
			}

			// Enrich message with server-side information
			msg.SenderID = c.userID
			if msg.CreatedAt.IsZero() {
				msg.CreatedAt = time.Now()
			}

			// Check for 'make_disappear' flag from client
			var rawClientMsg map[string]interface{}
			if err := json.Unmarshal(message, &rawClientMsg); err == nil {
				if makeDisappear, ok := rawClientMsg["make_disappear"].(bool); ok && makeDisappear {
					if msg.DisappearingAt == nil { // Only set if not already set (e.g. by server override)
						disappearTime := time.Now().Add(1 * time.Minute) // MVP: Disappears in 1 minute
						msg.DisappearingAt = &disappearTime
						log.Printf("Message from UserID %d (to ReceiverID %v) marked to disappear at %v", c.userID, msg.ReceiverID, disappearTime)
					}
				}
			}


			// TODO: Validate message content (e.g. ReceiverID exists, ContentType is valid)

			// Save message to database
			savedMsg, err := saveMessageToDB(context.Background(), msg)
			if err != nil {
				log.Printf("Error saving message to DB from UserID %d: %v", c.userID, err)
				// Optionally send an error message back to the client
				// c.send <- []byte(`{"error": "Failed to save message"}`)
				continue
			}

			// Marshal the (potentially updated) message back to JSON for broadcasting
			// This ensures fields like ID and CreatedAt (if set by DB) are included.
			updatedMessageBytes, err := json.Marshal(savedMsg)
			if err != nil {
				log.Printf("Error marshalling saved message for broadcast from UserID %d: %v", c.userID, err)
				continue
			}

			// Send the processed and saved message to the hub for broadcasting
			c.hub.BroadcastMessage(updatedMessageBytes)
		} else if messageType == websocket.BinaryMessage {
			// TODO: Handle binary messages (file uploads)
			log.Printf("Received binary message from UserID %d. Length: %d. Handling not yet implemented.", c.userID, len(message))
		}
	}
}

// writePump pumps messages from the hub to the websocket connection.
//
// A goroutine running writePump is started for each connection. The
// application ensures that there is at most one writer to a connection by
// executing all writes from this goroutine.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close() // Ensure connection is closed if writePump exits
		log.Printf("Stopped writePump for UserID %d, RemoteAddr: %s", c.userID, c.conn.RemoteAddr())
	}()
	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel.
				log.Printf("Hub closed client send channel for UserID %d. Closing WebSocket.", c.userID)
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				log.Printf("Error getting next writer for UserID %d: %v", c.userID, err)
				return
			}
			_, err = w.Write(message)
			if err != nil {
				log.Printf("Error writing message to WebSocket for UserID %d: %v", c.userID, err)
				// No return here, try to close writer and continue or let ping handle dead connection
			}

			// Add queued chat messages to the current websocket message.
			// This is an optimization to send multiple messages in one WebSocket frame if available.
			n := len(c.send)
			for i := 0; i < n; i++ {
				_, err := w.Write(newline) // Write newline separator between messages
				if err != nil {
					log.Printf("Error writing newline separator for UserID %d: %v", c.userID, err)
					// No return, try to close writer
					break
				}
				msgBytes := <-c.send
				_, err = w.Write(msgBytes)
				if err != nil {
					log.Printf("Error writing queued message to WebSocket for UserID %d: %v", c.userID, err)
					// No return, try to close writer
					break
				}
			}

			if err := w.Close(); err != nil {
				log.Printf("Error closing writer for UserID %d: %v", c.userID, err)
				return // Error closing writer is critical
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				log.Printf("Error sending ping to UserID %d: %v. Closing connection.", c.userID, err)
				return // Assume connection is dead if ping fails
			}
			log.Printf("Sent Ping to UserID %d", c.userID)
		}
	}
}

// saveMessageToDB saves a message to the database.
func saveMessageToDB(ctx context.Context, msg models.Message) (models.Message, error) {
	// Basic validation
	if msg.SenderID == 0 || msg.ContentType == "" || msg.Content == "" {
		return models.Message{}, log.Output(0, "message validation failed: sender, content type, and content are required")
	}
	// For MVP, ReceiverID must be present for 1-on-1 text messages.
	// GroupID logic will come later.
	if msg.ReceiverID == nil || *msg.ReceiverID == 0 {
		// If not a group message (which we aren't handling fully yet)
		if msg.GroupID == nil || *msg.GroupID == 0 {
			return models.Message{}, log.Output(0, "message validation failed: receiver_id is required for non-group messages")
		}
	}


	query := `INSERT INTO messages (sender_id, receiver_id, group_id, content_type, content, created_at, is_edited, disappearing_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              RETURNING id, created_at` // Return ID and actual DB created_at

	var dbID int64
	var dbCreatedAt time.Time

	err := db.Pool.QueryRow(ctx, query,
		msg.SenderID, msg.ReceiverID, msg.GroupID, msg.ContentType, msg.Content,
		msg.CreatedAt, msg.IsEdited, msg.DisappearingAt,
	).Scan(&dbID, &dbCreatedAt)

	if err != nil {
		return models.Message{}, log.Output(0, fmt.Sprintf("failed to insert message into DB: %v", err))
	}

	msg.ID = dbID
	msg.CreatedAt = dbCreatedAt // Update with the timestamp from the DB

	log.Printf("Message saved to DB. ID: %d, SenderID: %d, ReceiverID: %v, ContentType: %s",
		msg.ID, msg.SenderID, msg.ReceiverID, msg.ContentType)
	return msg, nil
}

// TODO: Function to handle media message saving (store file, then save metadata to DB)
// func saveMediaMessageToDB(ctx context.Context, msg models.Message, fileData []byte, fileName string, fileType string, fileSize int64) (models.Message, error)
// This would involve:
// 1. Storing the file to a configured path (e.g., ./uploads/user_<id>/<filename>)
// 2. Creating a messages entry with content_type='image'/'file', content pointing to file metadata or filename.
// 3. Creating a media_files entry linking to the message_id and storing file details.
// 4. Broadcasting the media message (perhaps with a URL to access the file).
