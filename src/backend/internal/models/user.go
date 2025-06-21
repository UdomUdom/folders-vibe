package models

import "time"

type User struct {
	ID           int64     `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"` // Don't send password hash to client
	CreatedAt    time.Time `json:"created_at"`
}

type Message struct {
	ID             int64      `json:"id"`
	SenderID       int64      `json:"sender_id"`
	ReceiverID     *int64     `json:"receiver_id,omitempty"` // Pointer for nullability
	GroupID        *int64     `json:"group_id,omitempty"`    // Pointer for nullability
	ContentType    string     `json:"content_type"`          // "text", "image", "file", etc.
	Content        string     `json:"content"`               // Text content or file metadata (e.g., URL or filename)
	CreatedAt      time.Time  `json:"created_at"`
	IsEdited       bool       `json:"is_edited"`
	DisappearingAt *time.Time `json:"disappearing_at,omitempty"` // Pointer for nullability
}

type MediaFile struct {
	ID          int64  `json:"id"`
	MessageID   int64  `json:"message_id"`
	FileName    string `json:"file_name"`
	FileType    string `json:"file_type"` // MIME type
	FileSize    int64  `json:"file_size"` // In bytes
	StoragePath string `json:"-"`         // Internal storage path, not sent to client
}

// For client-side representation, we might send a URL instead of StoragePath
type MediaFileResponse struct {
	ID        int64  `json:"id"`
	MessageID int64  `json:"message_id"`
	FileName  string `json:"file_name"`
	FileType  string `json:"file_type"`
	FileSize  int64  `json:"file_size"`
	URL       string `json:"url"` // URL to access the file
}

// Registration and Login Payloads
type RegisterPayload struct {
	Username string `json:"username" validate:"required,min=3,max=30"`
	Password string `json:"password" validate:"required,min=6,max=100"`
}

type LoginPayload struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

type LoginResponse struct {
	Token    string `json:"token"`
	UserID   int64  `json:"user_id"`
	Username string `json:"username"`
}
