package models

// ContextKey is a type used for context keys to avoid collisions.
type ContextKey string

const (
	// UserIDContextKey is the key used to store the user ID in the request context.
	UserIDContextKey = ContextKey("userID")
)
