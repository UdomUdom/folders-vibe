document.addEventListener('DOMContentLoaded', () => {
    const usernameDisplay = document.getElementById('username-display');
    const logoutButton = document.getElementById('logout-button');
    const contactsListEl = document.getElementById('contacts-list');
    const messagesDisplayEl = document.getElementById('messages-display');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const fileInput = document.getElementById('file-input');
    const chattingWithUsernameEl = document.getElementById('chatting-with-username');
    const chatErrorEl = document.getElementById('chat-error');
    const addContactInput = document.getElementById('contact-id-input');
    const addContactButton = document.getElementById('add-contact-button');
    const disappearCheckbox = document.getElementById('disappear-checkbox');
    const searchInput = document.getElementById('search-input');


    const authToken = localStorage.getItem('authToken');
    const currentUserId = localStorage.getItem('userId');
    const currentUsername = localStorage.getItem('username');

    if (!authToken || !currentUserId || !currentUsername) {
        window.location.href = 'index.html'; // Redirect to login if not authenticated
        return;
    }

    usernameDisplay.textContent = currentUsername;

    const API_BASE_URL = 'http://localhost:8080/api';
    const WS_BASE_URL = 'ws://localhost:8080/ws'; // Adjust if your WebSocket runs elsewhere

    let socket;
    let activeChatUserId = null;
    let contacts = {}; // Store contact info: { userId: username }

    function setupWebSocket() {
        socket = new WebSocket(`${WS_BASE_URL}?token=${authToken}`); // Send token as query param for initial auth

        socket.onopen = () => {
            console.log('WebSocket connection established.');
            chatErrorEl.textContent = '';
        };

        socket.onmessage = (event) => {
            console.log('Message from server:', event.data);
            try {
                const message = JSON.parse(event.data);
                displayMessage(message);

                // If the message is for the active chat, or from self to active chat
                if ((message.sender_id === activeChatUserId && message.receiver_id == currentUserId) ||
                    (message.sender_id == currentUserId && message.receiver_id === activeChatUserId) ||
                    (message.sender_id == currentUserId && message.receiver_id === parseInt(activeChatUserId)) // Ensure types match
                ) {
                    // Already displayed by displayMessage
                } else if (message.sender_id != currentUserId && message.receiver_id == currentUserId) {
                    // Notify for new message from another contact
                    alert(`New message from User ID: ${message.sender_id}`);
                    if (!contacts[message.sender_id]) {
                        // If sender is not in contacts, try to add them (or prompt user)
                        // For now, just log. A real app might fetch username.
                        console.log(`Received message from unknown User ID: ${message.sender_id}. Consider adding to contacts.`);
                    }
                }

            } catch (e) {
                console.error('Error parsing message from server:', e);
            }
        };

        socket.onclose = () => {
            console.log('WebSocket connection closed.');
            chatErrorEl.textContent = 'Connection lost. Attempting to reconnect...';
            // Implement reconnection logic if desired
            // setTimeout(setupWebSocket, 5000); // Attempt to reconnect every 5 seconds
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            chatErrorEl.textContent = 'WebSocket connection error.';
        };
    }

    function displayMessage(msg) {
        // Try to find an existing message div to update (for edits)
        let messageDiv = messagesDisplayEl.querySelector(`[data-message-id='${msg.id}']`);
        let isNewMessage = !messageDiv;

        if (isNewMessage) {
            messageDiv = document.createElement('div');
            messageDiv.classList.add('message');
            messageDiv.dataset.messageId = msg.id; // Add data attribute for later reference
        }
        // Clear previous content if updating, then set classes
        messageDiv.innerHTML = '';
        messageDiv.className = 'message'; // Reset classes
        messageDiv.classList.add(msg.sender_id == currentUserId ? 'self' : 'other');


        let contentHTML = '';
        const messageContentDiv = document.createElement('div'); // Wrapper for content part
        messageContentDiv.classList.add('message-content-wrapper');

        if (msg.content_type === 'text') {
            // Ensure marked and DOMPurify are loaded (they are via CDN in chat.html)
            if (typeof marked === 'function' && typeof DOMPurify === 'object') {
                const rawHtml = marked.parse(msg.content || ''); // Use marked.parse, not marked() in v4+
                contentHTML = `<div class="message-content">${DOMPurify.sanitize(rawHtml)}</div>`; // Sanitize output
            } else {
                console.warn('Marked or DOMPurify not loaded. Displaying as plain text.');
                contentHTML = `<p class="message-content">${escapeHTML(msg.content)}</p>`; // Keep as <p> for consistency
            }
        } else if (msg.content_type === 'text/system_disappeared') {
            contentHTML = `<p class="message-content message-disappeared"><em>${escapeHTML(msg.content)}</em></p>`;
        } else if (msg.content_type === 'image' || msg.content_type === 'video' || msg.content_type === 'file') {
            // Assuming msg.content is the original filename and msg.file_url is the actual link
            const fileName = escapeHTML(msg.content || 'Attached File');
            const fileUrl = msg.file_url; // This should come from the backend message broadcast

            if (msg.content_type === 'image' && fileUrl) {
                contentHTML = `<p class="message-content"><a href="${fileUrl}" target="_blank">${fileName}</a><br><img src="${fileUrl}" alt="${fileName}"></p>`;
            } else if (fileUrl) {
                 contentHTML = `<p class="message-content"><a href="${fileUrl}" target="_blank">Download ${fileName} (${msg.file_type || ''}, ${formatBytes(msg.file_size || 0)})</a></p>`;
            } else {
                contentHTML = `<p class="message-content">${fileName} (Error: URL missing)</p>`;
            }
        } else {
            contentHTML = `<p class="message-content"><em>Unsupported message type: ${escapeHTML(msg.content_type)}</em></p>`;
        }
        messageContentDiv.innerHTML = contentHTML;
        messageDiv.appendChild(messageContentDiv);

        const timestamp = new Date(msg.created_at).toLocaleTimeString();
        const editedMark = msg.is_edited ? ' <span class="edited-mark">(edited)</span>' : '';
        const timestampEl = document.createElement('span');
        timestampEl.classList.add('message-timestamp');
        timestampEl.innerHTML = timestamp + editedMark;
        messageDiv.appendChild(timestampEl);

        if (msg.sender_id == currentUserId && msg.content_type === 'text' && !messageDiv.querySelector('.edit-button')) { // Add edit button if it's own text message and not already there
            const editButton = document.createElement('button');
            editButton.classList.add('edit-button');
            editButton.textContent = 'Edit';
            editButton.onclick = () => startEditMode(messageDiv, msg);
            messageDiv.appendChild(editButton); // Consider placing it more strategically in the layout
        }

        // Only append if it's a new message and relevant to the current view
        if (isNewMessage) {
            if (msg.sender_id == currentUserId && msg.receiver_id == activeChatUserId ||
                msg.sender_id == activeChatUserId && msg.receiver_id == currentUserId) {
                messagesDisplayEl.appendChild(messageDiv);
            } else if (msg.receiver_id == currentUserId && !activeChatUserId) {
                // If no chat is active, and message is for me, maybe a general notification area?
            }
        }
        // Always scroll to bottom if the message is part of the active chat
        if (msg.sender_id == currentUserId && msg.receiver_id == activeChatUserId ||
            msg.sender_id == activeChatUserId && msg.receiver_id == currentUserId) {
             messagesDisplayEl.scrollTop = messagesDisplayEl.scrollHeight;
        }
    }


    function startEditMode(messageDiv, msg) {
        const contentWrapper = messageDiv.querySelector('.message-content-wrapper');
        const originalContentHTML = contentWrapper.innerHTML; // Keep the rendered HTML
        const rawTextContent = msg.content; // Use raw text for editing

        messageDiv.classList.add('editing');

        // Hide edit button, timestamp during edit
        const editButton = messageDiv.querySelector('.edit-button');
        if (editButton) editButton.style.display = 'none';
        const timestampEl = messageDiv.querySelector('.message-timestamp');
        if (timestampEl) timestampEl.style.display = 'none';

        contentWrapper.innerHTML = `
            <textarea class="edit-input">${escapeHTML(rawTextContent)}</textarea>
            <button class="save-edit-button">Save</button>
            <button class="cancel-edit-button">Cancel</button>
        `;

        messageDiv.querySelector('.save-edit-button').onclick = async () => {
            const newTextContent = messageDiv.querySelector('.edit-input').value;
            if (newTextContent.trim() === '') {
                alert('Message cannot be empty.');
                return;
            }
            await saveEdit(msg.id, newTextContent.trim(), messageDiv, originalContentHTML, msg);
        };
        messageDiv.querySelector('.cancel-edit-button').onclick = () => {
            cancelEdit(messageDiv, contentWrapper, originalContentHTML, msg);
        };
    }

    async function saveEdit(messageId, newContent, messageDiv, originalContentHTML, originalMsg) {
        try {
            const response = await fetch(`${API_BASE_URL}/chat/messages/${messageId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: newContent })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save edit');
            }
            // Backend will broadcast the update. The onmessage handler will catch it and update the UI.
            // For a slightly faster perceived update, we can revert to original and let WebSocket update.
            // Or, if backend returns the updated message, update directly.
            // For now, just remove editing UI and let WebSocket handle the update.
            console.log(`Edit for message ${messageId} sent. Waiting for WebSocket update.`);
            cancelEdit(messageDiv, messageDiv.querySelector('.message-content-wrapper'), originalContentHTML, originalMsg); // Revert UI optimistically

        } catch (error) {
            console.error('Error saving edit:', error);
            alert(`Error saving edit: ${error.message}`);
            // Optionally, restore original content or keep editing mode
            cancelEdit(messageDiv, messageDiv.querySelector('.message-content-wrapper'), originalContentHTML, originalMsg);
        }
    }

    function cancelEdit(messageDiv, contentWrapper, originalContentHTML, originalMsg) {
        messageDiv.classList.remove('editing');
        contentWrapper.innerHTML = originalContentHTML; // Restore original rendered HTML

        const editButton = messageDiv.querySelector('.edit-button');
        if (editButton) editButton.style.display = 'inline-block'; // Or 'block' depending on styling
        const timestampEl = messageDiv.querySelector('.message-timestamp');
        if (timestampEl) timestampEl.style.display = 'inline-block'; // Or 'block'

        // Re-attach edit button if it was removed or its event listener lost
        // This is simplified; a robust solution might re-render the message or re-attach precisely
        if (editButton && !messageDiv.querySelector('.edit-button')) { // If it was somehow removed entirely
             const newEditButton = document.createElement('button');
             newEditButton.classList.add('edit-button');
             newEditButton.textContent = 'Edit';
             newEditButton.onclick = () => startEditMode(messageDiv, originalMsg); // originalMsg needed here
             messageDiv.appendChild(newEditButton);
        } else if (editButton) { // Re-attach listener to existing button
            editButton.onclick = () => startEditMode(messageDiv, originalMsg);
        }
    }


    async function fetchMessages(contactId) {
        if (!contactId) return;
        messagesDisplayEl.innerHTML = ''; // Clear previous messages
        try {
            const response = await fetch(`${API_BASE_URL}/chat/messages?contact_id=${contactId}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (response.ok) {
                const messages = await response.json();
                messages.forEach(displayMessage);
            } else {
                console.error('Failed to fetch messages:', response.statusText);
                chatErrorEl.textContent = 'Failed to load messages.';
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            chatErrorEl.textContent = 'Error loading messages.';
        }
    }

    function sendMessage(content, type = 'text', receiverId) {
        if (!receiverId) {
            chatErrorEl.textContent = "Select a contact to send a message.";
            return;
        }
        if (socket && socket.readyState === WebSocket.OPEN) {
            const messagePayload = {
                receiver_id: parseInt(receiverId), // Ensure it's a number
                content_type: type,
                content: content
            };
            if (disappearCheckbox.checked) {
                messagePayload.make_disappear = true;
            }
            socket.send(JSON.stringify(messagePayload));

            if (type === 'text') {
                 messageInput.value = ''; // Clear input after sending text
                 disappearCheckbox.checked = false; // Reset checkbox
            }
        } else {
            chatErrorEl.textContent = 'WebSocket is not connected.';
        }
    }

    async function sendFile(file, receiverId) {
        if (!receiverId) {
            chatErrorEl.textContent = "Select a contact to send a file to.";
            return;
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            chatErrorEl.textContent = 'File is too large (max 10MB).';
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('receiver_id', receiverId);

        try {
            const response = await fetch(`${API_BASE_URL}/chat/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` },
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                // The backend /upload should ideally save the message and then broadcast it via WebSocket.
                // The client will receive it via socket.onmessage and displayMessage will handle it.
                // No need to manually call displayMessage here if backend broadcasts.
                console.log('File uploaded successfully, backend will broadcast:', data);
                chatErrorEl.textContent = ''; // Clear any previous error
            } else {
                chatErrorEl.textContent = `File upload failed: ${data.error || data.message || 'Unknown error'}`;
            }
        } catch (error) {
            console.error('File upload error:', error);
            chatErrorEl.textContent = 'An error occurred during file upload.';
        }
        fileInput.value = ''; // Reset file input
    }


    function renderContacts() {
        contactsListEl.innerHTML = ''; // Clear existing contacts
        Object.keys(contacts).forEach(userId => {
            if (userId == currentUserId) return; // Don't list self

            const contactLi = document.createElement('li');
            contactLi.classList.add('contact-item');
            contactLi.dataset.userid = userId;
            contactLi.textContent = contacts[userId] || `User ${userId}`; // Display username or User ID

            if (userId == activeChatUserId) {
                contactLi.classList.add('active-chat');
            }

            contactLi.addEventListener('click', () => {
                if (activeChatUserId === userId) return; // Already active

                activeChatUserId = userId;
                chattingWithUsernameEl.textContent = contacts[userId] || `User ${userId}`;
                document.querySelectorAll('.contact-item.active-chat').forEach(el => el.classList.remove('active-chat'));
                contactLi.classList.add('active-chat');
                fetchMessages(userId);
                chatErrorEl.textContent = '';
            });
            contactsListEl.appendChild(contactLi);
        });
    }

    // Function to add a contact (by User ID) and fetch their username (optional)
    async function addOrOpenChat(contactUserId) {
        contactUserId = parseInt(contactUserId);
        if (isNaN(contactUserId) || contactUserId == currentUserId) {
            chatErrorEl.textContent = "Invalid User ID or cannot chat with self.";
            return;
        }

        if (!contacts[contactUserId]) {
            // For MVP, we don't have a /users/{id} endpoint to get username.
            // So, we'll just use "User X"
            contacts[contactUserId] = `User ${contactUserId}`;
            renderContacts(); // Re-render to show new contact
        }

        // Switch to this chat
        activeChatUserId = contactUserId;
        chattingWithUsernameEl.textContent = contacts[contactUserId];
        document.querySelectorAll('.contact-item.active-chat').forEach(el => el.classList.remove('active-chat'));
        const contactEl = contactsListEl.querySelector(`[data-userid='${contactUserId}']`);
        if (contactEl) {
            contactEl.classList.add('active-chat');
        }
        fetchMessages(contactUserId);
        chatErrorEl.textContent = '';
        addContactInput.value = '';
    }


    // Event Listeners
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        if (socket) socket.close();
        window.location.href = 'index.html';
    });

    sendButton.addEventListener('click', () => {
        const messageText = messageInput.value.trim();
        if (messageText) {
            sendMessage(messageText, 'text', activeChatUserId);
        }
    });

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && activeChatUserId) {
            sendFile(file, activeChatUserId);
        } else if (!activeChatUserId) {
            chatErrorEl.textContent = "Please select a chat to send the file to.";
            fileInput.value = ''; // Reset
        }
    });

    addContactButton.addEventListener('click', () => {
        const contactId = addContactInput.value.trim();
        if (contactId) {
            addOrOpenChat(contactId);
        }
    });

    // Initial Setup
    setupWebSocket();
    // For MVP, contacts are manually added or derived from messages.
    // A real app would fetch a contact list.
    // Let's add a default contact for testing if backend has user ID 2 for example
    // addOrOpenChat('2'); // Example: automatically open chat with User ID 2 if they exist
    // renderContacts(); // Initial render with any predefined contacts

    // --- Helper Functions ---
    function escapeHTML(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/[&<>"']/g, function (match) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[match];
        });
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Client-side search logic
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase().trim();

        // Search contacts
        const contactItems = contactsListEl.querySelectorAll('.contact-item');
        contactItems.forEach(item => {
            const contactName = item.textContent.toLowerCase();
            if (contactName.includes(searchTerm)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });

        // Search messages in the active chat
        const messageItems = messagesDisplayEl.querySelectorAll('.message');
        messageItems.forEach(item => {
            // Search only in the text content of the message, not HTML structure or timestamps for simplicity
            const messageTextContent = item.querySelector('.message-content')?.textContent.toLowerCase() ||
                                       item.querySelector('.message-content-wrapper')?.textContent.toLowerCase() ||
                                       '';
            if (messageTextContent.includes(searchTerm)) {
                item.style.display = ''; // Or 'flex' if your messages are flex items
            } else {
                item.style.display = 'none';
            }
        });

        // If search term is empty, ensure all are visible
        if (searchTerm === '') {
            contactItems.forEach(item => item.style.display = '');
            messageItems.forEach(item => item.style.display = ''); // Or 'flex'
        }
    });

});
