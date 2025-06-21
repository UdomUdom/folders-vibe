-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- For 1-on-1, can be NULL for group chats later
    -- group_id INTEGER REFERENCES groups(id), -- To be added for group chats
    content_type TEXT NOT NULL, -- e.g., 'text', 'image', 'file'
    content TEXT NOT NULL, -- For text messages, or metadata for files (like filename)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT FALSE,
    disappearing_at TIMESTAMPTZ -- NULL if the message doesn't disappear
);

-- Media Files Table
CREATE TABLE IF NOT EXISTS media_files (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL, -- MIME type
    file_size BIGINT NOT NULL, -- Size in bytes
    storage_path TEXT NOT NULL -- Path to where the file is stored on the server
);

-- Future: Groups Table (for group chats)
-- CREATE TABLE IF NOT EXISTS groups (
--     id SERIAL PRIMARY KEY,
--     name TEXT NOT NULL,
--     creator_id INTEGER REFERENCES users(id),
--     created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Future: Group Members Table
-- CREATE TABLE IF NOT EXISTS group_members (
--     group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
--     user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
--     joined_at TIMESTAMPTZ DEFAULT NOW(),
--     PRIMARY KEY (group_id, user_id)
-- );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
-- CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
