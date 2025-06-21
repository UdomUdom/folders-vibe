package handlers

import (
	"encoding/json"
	"msgtext/backend/internal/auth"
	"msgtext/backend/internal/models"
	"net/http"
)

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	var payload models.RegisterPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Basic validation (in a real app, use a validation library)
	if payload.Username == "" || payload.Password == "" {
		http.Error(w, "Username and password are required", http.StatusBadRequest)
		return
	}
	if len(payload.Password) < 6 {
		http.Error(w, "Password must be at least 6 characters long", http.StatusBadRequest)
		return
	}

	user, err := auth.RegisterUser(r.Context(), payload.Username, payload.Password)
	if err != nil {
		// More specific error handling could be done here (e.g., username taken)
		http.Error(w, "Failed to register user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Generate JWT token
	tokenString, err := auth.GenerateJWT(user.ID, user.Username)
	if err != nil {
		http.Error(w, "Failed to generate token: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := models.LoginResponse{
		Token:    tokenString,
		UserID:   user.ID,
		Username: user.Username,
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var payload models.LoginPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	if payload.Username == "" || payload.Password == "" {
		http.Error(w, "Username and password are required", http.StatusBadRequest)
		return
	}

	user, err := auth.AuthenticateUser(r.Context(), payload.Username, payload.Password)
	if err != nil {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}

	tokenString, err := auth.GenerateJWT(user.ID, user.Username)
	if err != nil {
		http.Error(w, "Failed to generate token: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := models.LoginResponse{
		Token:    tokenString,
		UserID:   user.ID,
		Username: user.Username,
	}
	json.NewEncoder(w).Encode(response)
}
