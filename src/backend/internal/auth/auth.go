package auth

import (
	"context"
	"errors"
	"fmt"
	"msgtext/backend/internal/db"
	"msgtext/backend/internal/models"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// jwtKey is used to sign and verify JWT tokens.
// In a production application, this should be loaded from a secure configuration source.
var jwtKey = []byte(os.Getenv("JWT_SECRET_KEY"))

func init() {
	if len(jwtKey) == 0 {
		fmt.Println("Warning: JWT_SECRET_KEY environment variable not set. Using default insecure key.")
		jwtKey = []byte("super-secret-key-that-should-be-changed")
	}
}

// HashPassword generates a bcrypt hash of the password.
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 12) // 12 is a reasonable cost
	return string(bytes), err
}

// CheckPasswordHash compares a password with a bcrypt hash.
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// RegisterUser creates a new user in the database.
func RegisterUser(ctx context.Context, username, password string) (models.User, error) {
	hashedPassword, err := HashPassword(password)
	if err != nil {
		return models.User{}, fmt.Errorf("failed to hash password: %w", err)
	}

	var user models.User
	query := `INSERT INTO users (username, password_hash) VALUES ($1, $2)
			  RETURNING id, username, created_at`
	err = db.Pool.QueryRow(ctx, query, username, hashedPassword).Scan(&user.ID, &user.Username, &user.CreatedAt)
	if err != nil {
		// TODO: Check for unique constraint violation specifically
		return models.User{}, fmt.Errorf("failed to register user: %w", err)
	}
	return user, nil
}

// AuthenticateUser checks user credentials and returns the user if valid.
func AuthenticateUser(ctx context.Context, username, password string) (models.User, error) {
	var user models.User
	query := `SELECT id, username, password_hash, created_at FROM users WHERE username = $1`
	err := db.Pool.QueryRow(ctx, query, username).Scan(&user.ID, &user.Username, &user.PasswordHash, &user.CreatedAt)
	if err != nil {
		// Consider pgx.ErrNoRows as invalid credentials
		return models.User{}, fmt.Errorf("invalid username or password")
	}

	if !CheckPasswordHash(password, user.PasswordHash) {
		return models.User{}, fmt.Errorf("invalid username or password")
	}
	return user, nil
}

// GenerateJWT creates a new JWT token for a given user ID.
func GenerateJWT(userID int64, username string) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour) // Token valid for 24 hours
	claims := &jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(expirationTime),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		Subject:   fmt.Sprintf("%d", userID), // Store userID as subject
		// You can add more claims here, like username if needed, but keep tokens small
		// "username": username,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}
	return tokenString, nil
}

// ValidateJWT parses and validates a JWT token string.
// Returns the claims if the token is valid, otherwise an error.
func ValidateJWT(tokenString string) (*jwt.RegisteredClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtKey, nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, fmt.Errorf("token has expired: %w", err)
		}
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	if claims, ok := token.Claims.(*jwt.RegisteredClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}
