package main

import (
	"context"
	"log"
	"msgtext/backend/internal/chat"
	"msgtext/backend/internal/db"
	"msgtext/backend/internal/handlers"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gorilla/mux"
)

var globalHub *chat.Hub // Global instance of the Hub

func main() {
	// Initialize Database Connection
	if err := db.InitDB(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.CloseDB()

	// Create and run the WebSocket Hub
	globalHub = chat.NewHub()
	go globalHub.Run()

	// Setup Router
	r := mux.NewRouter()

	// API Routes
	apiRouter := r.PathPrefix("/api").Subrouter()

	// Authentication routes
	authRouter := apiRouter.PathPrefix("/auth").Subrouter()
	authRouter.HandleFunc("/register", handlers.RegisterHandler).Methods("POST")
	authRouter.HandleFunc("/login", handlers.LoginHandler).Methods("POST")

	// Chat routes (require JWT authentication)
	chatRouter := apiRouter.PathPrefix("/chat").Subrouter()
	chatRouter.Use(handlers.JWTMiddleware) // Apply JWT middleware to all chat routes
	chatRouter.HandleFunc("/messages", handlers.GetMessagesHandler).Methods("GET")
	// Use the New... constructors to pass the hub instance
	chatRouter.HandleFunc("/messages", handlers.NewSendMessageHandler(globalHub)).Methods("POST")
	chatRouter.HandleFunc("/messages/{message_id:[0-9]+}", handlers.NewEditMessageHandler(globalHub)).Methods("PUT") // New route for editing
	chatRouter.HandleFunc("/upload", handlers.NewUploadFileHandler(globalHub)).Methods("POST")

	// File serving route (does not strictly need JWT if files are public once URL is known,
	// but if files are private, this also needs protection, perhaps a signed URL or JWT)
	// For now, keeping it open for simplicity, but in prod, this needs careful thought.
	// The JWTMiddleware is NOT applied to /api/files/download route directly here.
	// If it were /api/chat/files/download, it would be.
	apiRouter.HandleFunc("/files/download/{filename}", handlers.ServeFileHandler).Methods("GET")


	// WebSocket route (requires JWT authentication, handled inside ServeWs by checking context)
	// The JWTMiddleware is applied before the handler is called.
	wsRouter := r.PathPrefix("/ws").Subrouter()
	wsRouter.Use(handlers.JWTMiddleware)
	wsRouter.HandleFunc("", func(w http.ResponseWriter, r *http.Request) {
		// Pass the globalHub instance to ServeWs
		chat.ServeWs(globalHub, w, r)
	})

	// Serve static files for frontend (if any, not part of this step yet)
	// fs := http.FileServer(http.Dir("./static"))
	// r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", fs))
	// r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
	//     http.ServeFile(w, r, "./static/index.html")
	// })


	// Server Configuration
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Default port
	}

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: r,
		// Good practice to set timeouts to avoid Slowloris attacks.
		WriteTimeout: time.Second * 15,
		ReadTimeout:  time.Second * 15,
		IdleTimeout:  time.Second * 60,
	}

	// Run server in a goroutine so that it doesn't block.
	go startMessageCleaner(globalHub) // Start the message cleaner goroutine

	go func() {
		log.Printf("Server starting on port %s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("ListenAndServe: %v", err)
		}
	}()

	// Graceful Shutdown
	c := make(chan os.Signal, 1)
	// We'll accept graceful shutdowns when quit via SIGINT (Ctrl+C)
	// SIGKILL, SIGQUIT or SIGTERM (Ctrl+/) will not be caught.
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	// Block until we receive our signal.
	<-c

	// Create a deadline to wait for.
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*15)
	defer cancel()

	log.Println("Shutting down server...")
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server Shutdown Failed:%+v", err)
	}

	log.Println("Server gracefully stopped")
}

func startMessageCleaner(hub *chat.Hub) {
	// In a real app, make ticker duration configurable
	ticker := time.NewTicker(30 * time.Second) // Check every 30 seconds
	defer ticker.Stop()

	log.Println("Starting Disappearing Message Cleaner goroutine.")

	for {
		select {
		case <-ticker.C:
			// log.Println("Message cleaner checking for messages to disappear...")
			processDisappearingMessages(hub)
		}
	}
}

func processDisappearingMessages(hub *chat.Hub) {
	ctx := context.Background()
	// Select messages that are due to disappear and haven't been processed yet
	// Using a distinct content_type for already processed messages.
	query := `
        SELECT id, sender_id, receiver_id, group_id
        FROM messages
        WHERE disappearing_at IS NOT NULL AND disappearing_at <= NOW()
        AND content_type != 'text/system_disappeared'`

	rows, err := db.Pool.Query(ctx, query)
	if err != nil {
		log.Printf("Error querying for disappearing messages: %v", err)
		return
	}
	defer rows.Close()

	var messagesToUpdate []struct { // Using a simple struct for IDs initially
		ID         int64
		SenderID   int64
		ReceiverID *int64
		GroupID    *int64
	}
	for rows.Next() {
		var m struct {
			ID         int64
			SenderID   int64
			ReceiverID *int64
			GroupID    *int64
		}
		if err := rows.Scan(&m.ID, &m.SenderID, &m.ReceiverID, &m.GroupID); err != nil {
			log.Printf("Error scanning disappearing message row: %v", err)
			continue
		}
		messagesToUpdate = append(messagesToUpdate, m)
	}
	if rows.Err() != nil {
		log.Printf("Error after iterating disappearing message rows: %v", rows.Err())
	}

	if len(messagesToUpdate) == 0 {
		return // Nothing to do
	}
	log.Printf("Found %d message(s) to mark as disappeared.", len(messagesToUpdate))

	for _, m := range messagesToUpdate {
		tx, err := db.Pool.Begin(ctx)
		if err != nil {
			log.Printf("Error starting transaction for disappearing message ID %d: %v", m.ID, err)
			continue
		}

		var updatedMsg models.Message
		updateQuery := `
            UPDATE messages
            SET content = $1,
                content_type = $2,
                disappearing_at = NULL,
                is_edited = TRUE,
                created_at = NOW()
            WHERE id = $3
            RETURNING id, sender_id, receiver_id, group_id, content_type, content, created_at, is_edited, disappearing_at`

		// Note: Updating 'created_at' to NOW() makes it act like 'updated_at' for sorting.
		// 'is_edited = TRUE' also makes sense as content changed.
		err = tx.QueryRow(ctx, updateQuery,
			"This message has disappeared.", // New content
			"text/system_disappeared",       // New content type
			m.ID,
		).Scan(
			&updatedMsg.ID, &updatedMsg.SenderID, &updatedMsg.ReceiverID, &updatedMsg.GroupID,
			&updatedMsg.ContentType, &updatedMsg.Content, &updatedMsg.CreatedAt,
			&updatedMsg.IsEdited, &updatedMsg.DisappearingAt,
		)

		if err != nil {
			log.Printf("Error updating disappearing message ID %d in DB: %v", m.ID, err)
			if rbErr := tx.Rollback(ctx); rbErr != nil {
				log.Printf("Error rolling back transaction for message ID %d: %v", m.ID, rbErr)
			}
			continue
		}

		if err := tx.Commit(ctx); err != nil {
			log.Printf("Error committing transaction for disappearing message ID %d: %v", m.ID, err)
			continue
		}

		log.Printf("Message ID %d successfully marked as disappeared.", m.ID)

		// Broadcast the "disappeared" update
		if hub != nil {
			messageBytes, jsonErr := json.Marshal(updatedMsg)
			if jsonErr != nil {
				log.Printf("Error marshalling disappeared message (ID: %d) for broadcast: %v", updatedMsg.ID, jsonErr)
			} else {
				hub.BroadcastMessage(messageBytes)
				log.Printf("Disappeared message update (ID: %d) broadcasted.", updatedMsg.ID)
			}
		}
	}
}
