document.addEventListener('DOMContentLoaded', async () => {
    await fetchUsers();
});

async function fetchUsers() {
    try {
        const response = await fetch('/api/get-users', { credentials: 'include' });
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }

        const users = await response.json();
        const currentUserId = await getCurrentUserId();
        const filteredUsers = users.filter(user => user._id !== currentUserId);

        displayUsers(filteredUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        document.getElementById('user-list').innerHTML = '<li>Error loading users.</li>';
    }
}

async function getCurrentUserId() {
    try {
        const response = await fetch('/api/user', { credentials: 'include' });
        if (response.ok) {
            const userInfo = await response.json();
            return userInfo._id;
        }
    } catch (error) {
        console.error('Error fetching current user ID:', error);
    }
    return null;
}

function displayUsers(users) {
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';

    if (users.length === 0) {
        userList.innerHTML = '<li>No other users available for chat.</li>';
        return;
    }

    users.forEach(user => {
        const listItem = document.createElement('li');
        listItem.textContent = user.username;
        listItem.dataset.userId = user._id; 
        listItem.addEventListener('click', () => {
            openChatWindow(user._id);
        });
        userList.appendChild(listItem);
    });
}

async function openChatWindow(userId) {
    try {
        const response = await fetch(`/api/get-user/${userId}`, { credentials: 'include' });
        if (!response.ok) {
            throw new Error('Failed to fetch user info');
        }
        const user = await response.json();
        const chatWindow = document.getElementById('chat-window');
        chatWindow.innerHTML = `
            <div class="chat-header">
                <h3>Chat with ${user.username}</h3>
            </div>
            <div class="chat-messages" id="chat-messages-${userId}"></div> 
            <div class="chat-input">
                <input type="text" id="message-input-${userId}" placeholder="Type a message...">
                <button onclick="sendMessage('${userId}')">Send</button>
            </div>
        `;
        await fetchMessages(userId); 
    } catch (error) {
        console.error('Error fetching user info:', error);
    }
}

let currentUserId;

async function fetchMessages(userId) {
    try {
        const currentUserId = await getCurrentUser(); 
        const response = await fetch(`/api/get-messages/${userId}`, { credentials: 'include' }); 
        if (!response.ok) {
            throw new Error('Failed to fetch messages');
        }
        const data = await response.json();
        if (data.newChat) {
            console.log('This is a new chat!');
        } else {
            displayMessages(data, userId); 
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

async function sendMessage(receiverId) {
    const messageInput = document.getElementById(`message-input-${receiverId}`);
    const message = messageInput.value.trim();

    if (message === '') return; 

    try {
        const currentUserId = await getCurrentUserId();
        const response = await fetch('/api/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                senderId: currentUserId,
                receiverId,
                message
            }),
            credentials: 'include'
        });
        if (response.ok) {
            messageInput.value = ''; 
            await fetchMessages(receiverId); 
        } else {
            console.error('Error sending message:', response.statusText);
        }
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

function displayMessages(messages, userId) {
    const messagesContainer = document.getElementById(`chat-messages-${userId}`);
    messagesContainer.innerHTML = messages.map(msg => `
        <div class="message ${msg.senderId === currentUserId ? 'sent' : 'received'}">
            <p><strong>${msg.senderId === currentUserId ? 'You' : msg.username}</strong>: ${msg.message}</p>
        </div>
    `).join('');
}

async function getCurrentUser() {
    try {
        const response = await fetch('/api/current-user', { credentials: 'include' });
        if (response.ok) {
            const user = await response.json();
            return user._id; 
        }
    } catch (error) {
        console.error('Error fetching current user ID:', error);
    }
    return null; 
}

