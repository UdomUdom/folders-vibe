package chat

import (
	"encoding/json"
	"fmt"
	"log"
	"msgtext/backend/internal/models" // Already has models
	// "msgtext/backend/internal/handlers" // No longer needed directly for context key
	"sync"

	"github.com/gorilla/websocket"
)

// Hub maintains the set of active clients and broadcasts messages to the clients.
type Hub struct {
	// Registered clients. maps client pointer to a boolean (true if active)
	clients map[*Client]bool

	// Inbound messages from the clients.
	broadcast chan []byte //
	// broadcast chan models.Message // More structured, but []byte is simpler for direct relay

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client

	// Map userID to a set of their active clients (WebSocket connections)
	// This allows sending messages directly to a specific user's connections.
	userClients   map[int64]map[*Client]bool
	userClientsMu sync.RWMutex // To protect concurrent access to userClients
}

func NewHub() *Hub {
	return &Hub{
		broadcast:   make(chan []byte),
		register:    make(chan *Client),
		unregister:  make(chan *Client),
		clients:     make(map[*Client]bool),
		userClients: make(map[int64]map[*Client]bool),
	}
}

func (h *Hub) Run() {
	log.Println("Chat Hub started")
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			h.userClientsMu.Lock()
			if _, ok := h.userClients[client.userID]; !ok {
				h.userClients[client.userID] = make(map[*Client]bool)
			}
			h.userClients[client.userID][client] = true
			h.userClientsMu.Unlock()
			log.Printf("Client registered: UserID %d, RemoteAddr: %s", client.userID, client.conn.RemoteAddr())

		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)

				h.userClientsMu.Lock()
				if userConns, ok := h.userClients[client.userID]; ok {
					delete(userConns, client)
					if len(userConns) == 0 {
						delete(h.userClients, client.userID)
					}
				}
				h.userClientsMu.Unlock()
				log.Printf("Client unregistered: UserID %d, RemoteAddr: %s", client.userID, client.conn.RemoteAddr())
			}

		case messageBytes := <-h.broadcast:
			// For MVP, we broadcast all messages to all clients.
			// In a real app, this needs to be more sophisticated to send messages
			// only to relevant users (e.g., receiver_id or group_id).

			var msg models.Message
			if err := json.Unmarshal(messageBytes, &msg); err != nil {
				log.Printf("Error unmarshalling broadcast message: %v", err)
				continue
			}

			log.Printf("Broadcasting message from SenderID: %d, ContentType: %s", msg.SenderID, msg.ContentType)

			// Send to specific receiver if ReceiverID is set (for 1-on-1 chat)
			if msg.ReceiverID != nil && *msg.ReceiverID != 0 {
				h.userClientsMu.RLock()
				receiverConns, ok := h.userClients[*msg.ReceiverID]
				h.userClientsMu.RUnlock()

				if ok {
					for client := range receiverConns {
						select {
						case client.send <- messageBytes:
						default: // Don't block if send buffer is full
							log.Printf("Send buffer full for client: UserID %d, RemoteAddr: %s", client.userID, client.conn.RemoteAddr())
							// Optionally, unregister the client here or handle it differently
							// close(client.send)
							// delete(h.clients, client)
						}
					}
					log.Printf("Sent direct message to UserID: %d", *msg.ReceiverID)
				} else {
					log.Printf("ReceiverID %d not connected or does not exist.", *msg.ReceiverID)
					// TODO: Handle offline messaging (store and deliver later)
				}

				// Also send to self (sender) so their other devices get the message
				h.userClientsMu.RLock()
				senderConns, senderOk := h.userClients[msg.SenderID]
				h.userClientsMu.RUnlock()
				if senderOk {
					for client := range senderConns {
						// Don't send to the exact same connection that sent it if it's a direct message
						// This check might be tricky if not passing original client.
						// For now, sending to all sender's connections.
						select {
						case client.send <- messageBytes:
						default:
							log.Printf("Send buffer full for sender client: UserID %d, RemoteAddr: %s", client.userID, client.conn.RemoteAddr())
						}
					}
				}


			} else if msg.GroupID != nil && *msg.GroupID != 0 {
				// TODO: Implement group chat logic
				// - Get all members of msg.GroupID
				// - Send message to each connected member
				log.Printf("Group message received for GroupID %d. Broadcasting to group not yet implemented.", *msg.GroupID)
			} else {
				// Fallback: if no receiver or group, broadcast to all (e.g. for system messages or old behavior)
				// This should be refined or removed for targeted messaging.
				log.Println("Broadcasting to all clients (no specific receiver/group)")
				for client := range h.clients {
					select {
					case client.send <- messageBytes:
					default:
						log.Printf("Send buffer full for client during general broadcast: UserID %d, RemoteAddr: %s", client.userID, client.conn.RemoteAddr())
						// close(client.send)
						// delete(h.clients, client)
					}
				}
			}
		}
	}
}

// BroadcastMessage sends a message to the hub's broadcast channel.
// This is typically called by a client after it processes a message from its WebSocket connection.
func (h *Hub) BroadcastMessage(message []byte) {
	h.broadcast <- message
}

// ServeWs handles websocket requests from the peer.
func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	// Upgrade HTTP connection to WebSocket
	upgrader := websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			// Allow all origins for now. In production, restrict this.
			// Example: return r.Header.Get("Origin") == "http://localhost:3000"
			return true
		},
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Failed to upgrade connection to WebSocket:", err)
		return
	}

	// Extract userID from context (set by JWTMiddleware)
	// This ensures only authenticated users can connect to WebSocket.
	userID, ok := r.Context().Value(models.UserIDContextKey).(int64)
	if !ok || userID == 0 {
		log.Println("WebSocket connection attempt without user ID in context.")
		conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.ClosePolicyViolation, "User not authenticated"))
		conn.Close()
		return
	}

	log.Printf("WebSocket connection established for UserID: %d from %s", userID, r.RemoteAddr)

	client := NewClient(hub, conn, userID)
	client.hub.register <- client

	// Allow collection of memory referenced by the caller by doing all work in new goroutines.
	go client.writePump()
	go client.readPump()
}
