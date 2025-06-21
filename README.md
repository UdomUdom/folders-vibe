# MsgText Backend

This is the backend for the MsgText application, built with Go, PostgreSQL, and WebSockets.

## Prerequisites

- Go (version 1.19 or higher recommended)
- PostgreSQL server running
- Environment variable `DATABASE_URL` set (e.g., `export DATABASE_URL="postgres://user:password@localhost:5432/msgtext_db?sslmode=disable"`)
- Environment variable `JWT_SECRET_KEY` set for signing JWT tokens (e.g., `export JWT_SECRET_KEY="your-super-secret-and-long-key"`)

## Setup

1.  **Clone the repository (if applicable)**
    ```bash
    # git clone ...
    # cd msgtext_project_root
    ```
    (Assuming `go.mod` is at the project root, defining `module msgtext/backend`)

2.  **Install Dependencies:**
    If you haven't already, or if `go.sum` is not up to date:
    ```bash
    go mod tidy
    ```

3.  **Database Setup:**
    - Ensure your PostgreSQL server is running.
    - Create a database (e.g., `msgtext_db`).
    - Create a user with privileges on this database (e.g., `user` with `password`).
    - Update the `DATABASE_URL` environment variable accordingly.
    - Apply database migrations:
        - You'll need a way to run the SQL in `src/backend/migrations/001_init_schema.sql`.
        - You can use `psql` or any database tool:
          ```bash
          psql "$DATABASE_URL" -f src/backend/migrations/001_init_schema.sql
          ```
        - For robust migration management, consider tools like `golang-migrate/migrate` or `pressly/goose`.

4.  **Set Environment Variables:**
    ```bash
    export DATABASE_URL="postgres://youruser:yourpassword@yourhost:yourport/yourdbname?sslmode=disable"
    export JWT_SECRET_KEY="a_very_strong_and_long_secret_key_for_jwt_signing"
    export PORT="8080" # Optional, defaults to 8080
    ```
    It's recommended to use a `.env` file and a library like `joho/godotenv` for local development (not included in current setup).

## Running the Backend Server

1.  **Navigate to the project root directory (where `go.mod` is located).**
2.  **Run the server:**
    ```bash
    go run src/backend/cmd/server/main.go
    ```
    The server should start on the configured port (default 8080).

## API Endpoints (MVP)

All endpoints are prefixed with `/api`.

### Auth
-   `POST /api/auth/register`: Register a new user.
    -   Body: `{"username": "testuser", "password": "password123"}`
-   `POST /api/auth/login`: Login an existing user.
    -   Body: `{"username": "testuser", "password": "password123"}`
    -   Returns: JWT token, user ID, username.

### Chat (Requires Bearer Token in Authorization Header)
-   `GET /api/chat/messages?contact_id=<user_id>`: Get message history with another user.
-   `POST /api/chat/messages`: Send a text message (primarily for non-WebSocket scenarios or specific actions).
    -   Body: `{"receiver_id": 2, "content_type": "text", "content": "Hello there!"}`
-   `POST /api/chat/upload`: Upload a file.
    -   Form data: `file` (the file itself), `receiver_id` (ID of the recipient).
    -   Returns: Message object with `file_url`, `media_file_id` etc.

### File Serving
-   `GET /api/files/download/{uniqueFileName}`: Download an uploaded file.
    -   `{uniqueFileName}` is the server-generated unique name for the file (e.g., from the `file_url` returned by upload).

### WebSocket
-   `GET /ws` (Requires Bearer Token in Authorization Header, passed during WebSocket upgrade request)
    -   Establishes a WebSocket connection for real-time messaging.
    -   Clients send JSON messages, e.g.:
        `{"receiver_id": 2, "content_type": "text", "content": "Hi via WebSocket!"}`
    -   Server broadcasts messages to relevant clients.

## Project Structure (within the Go module `msgtext/backend`)

Assuming `go.mod` is in the project root and defines `module msgtext/backend`:

```
<project_root>/
├── go.mod
├── go.sum
├── README.md (this file)
├── src/
│   └── backend/
│       ├── cmd/server/main.go  -- Main application entry point
│       ├── internal/           -- Internal application logic
│       │   ├── auth/           -- Authentication (user reg, login, JWT)
│       │   ├── chat/           -- WebSocket hub, client, real-time logic
│       │   ├── db/             -- Database connection
│       │   ├── handlers/       -- HTTP handlers, middleware
│       │   └── models/         -- Data structures, context keys
│       └── migrations/         -- SQL database schema migrations
└── uploads/                    -- Directory for uploaded files (add to .gitignore)
```

## TODO for Backend MVP Completion/Refinement

-   **Robust Migration System:** Implement a proper migration tool.
-   **Configuration Management:** Use a library for `.env` files or Viper.
-   **Input Validation:** Add comprehensive validation for API payloads.
-   **Error Handling:** More structured error responses for APIs.
-   **Logging:** More structured logging (e.g., `log/slog`).
-   **Testing:** Add unit and integration tests.
-   **WebSocket Broadcast from HTTP:** Ensure messages from HTTP handlers (`SendMessageHandler`, `UploadFileHandler`) are broadcast over WebSockets. This requires HTTP handlers to access the `globalHub`. This is noted in `main.go` but not yet implemented.
-   **File Serving Security:** Continuously review `ServeFileHandler` for security.
-   **`.gitignore`**: Ensure `uploads/` and compiled binaries are in `.gitignore`.

This README describes the Go backend. A higher-level README for the entire "msgtext" application (including frontend, Electron app) would also be useful.

## Future Enhancements & Considerations

Beyond the immediate MVP refinements, the following major features and considerations are important for the evolution of MsgText:

-   **Core Messaging Features:**
    -   **End-to-End Encryption (E2EE):** Critical for privacy; requires significant research and careful implementation (e.g., Signal Protocol).
    -   **Add Friends / Invite Friends:** A proper social system for managing contacts.
    -   **Group Chats:** Support for multi-user conversations.
    -   **Voice/Video Calls:** Integration of WebRTC or third-party services.
    -   **Status Updates:** User presence and temporary status messages.
    -   **Push Notifications:** For mobile and desktop app engagement.

-   **Advanced Features & Extensibility:**
    -   **Stickers, Bots, Advanced File Sharing:** Richer content types and automated interactions.
    -   **Tags/Keywords:** For organizing messages or chats.
    -   **Webhook Support:** For integrations with other services.
    -   **Search Functionality (Backend):** Server-side search across all user messages.

-   **Scalability & Performance:**
    -   **Database Optimization:** Advanced indexing, query optimization, read replicas.
    -   **Backend Service Scaling:** Horizontal scaling of Go services, potentially microservices for specific features (e.g., media processing, notifications).
    -   **WebSocket Scaling:** Managing a large number of concurrent WebSocket connections (e.g., using a distributed pub/sub system like Redis or NATS behind the hubs).
    -   **CDN for Media Files:** Offload static asset and media file serving.
    -   **Load Balancing:** Distributing traffic across multiple backend instances.

-   **Mobile Application:**
    -   Development of native (iOS/Android) or cross-platform (React Native, Flutter) mobile applications. APIs should be designed with mobile clients in mind.

-   **Development & Operational Excellence:**
    -   **Comprehensive Testing:** Unit, integration, end-to-end, and performance testing.
    -   **CI/CD Pipelines:** Automated build, test, and deployment processes.
    -   **Detailed API Documentation:** Using tools like Swagger/OpenAPI.
    -   **Monitoring & Alerting:** For system health and performance.
    -   **Security Hardening:** Regular security audits, dependency vulnerability scanning, adherence to best practices for web and API security.
