package handlers

import (
	"context"
	"msgtext/backend/internal/auth"
	"msgtext/backend/internal/models" // Added import for models
	"net/http"
	"strconv"
	"strings"
)

// Removed local contextKey and UserIDContextKey, will use models.UserIDContextKey

// JWTMiddleware verifies the JWT token from the Authorization header.
// If the token is valid, it extracts the userID and adds it to the request context.
func JWTMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			http.Error(w, "Invalid Authorization header format (expected Bearer token)", http.StatusUnauthorized)
			return
		}
		tokenString := parts[1]

		claims, err := auth.ValidateJWT(tokenString)
		if err != nil {
			http.Error(w, "Invalid token: "+err.Error(), http.StatusUnauthorized)
			return
		}

		userIDStr := claims.Subject
		userID, err := strconv.ParseInt(userIDStr, 10, 64)
		if err != nil {
			http.Error(w, "Invalid user ID in token", http.StatusUnauthorized)
			return
		}

		// Add userID to context
		ctx := context.WithValue(r.Context(), models.UserIDContextKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetUserIDFromContext retrieves the user ID from the request context.
// Returns 0 and false if the user ID is not found.
func GetUserIDFromContext(ctx context.Context) (int64, bool) {
	userID, ok := ctx.Value(models.UserIDContextKey).(int64)
	return userID, ok
}
