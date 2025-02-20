let currentUser = '';
let selectedUser = '';
let users = JSON.parse(localStorage.getItem('users')) || [];
let messages = JSON.parse(localStorage.getItem('messages')) || {};

function login() {
    const username = document.getElementById('username').value.trim();
    if (!username) return alert('Please enter a username');

    currentUser = username;
    if (!users.includes(username)) {
        users.push(username);
        localStorage.setItem('users', JSON.stringify(users));
    }

    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('chat-screen').classList.remove('hidden');
    document.getElementById('current-user').textContent = currentUser;
    updateUserList();
}

function logout() {
    currentUser = '';
    selectedUser = '';
    document.getElementById('chat-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('username').value = '';
}

function updateUserList() {
    const searchTerm = document.getElementById('search-user').value.toLowerCase();
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';

    users
        .filter(user => user !== currentUser && user.toLowerCase().includes(searchTerm))
        .forEach(user => {
            const div = document.createElement('div');
            div.className = 'user-item';
            div.textContent = user;
            div.onclick = () => selectUser(user);
            userList.appendChild(div);
        });
}

function selectUser(user) {
    selectedUser = user;
    document.getElementById('chat-header').textContent = `Chat with ${user}`;
    updateMessages();
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    if (!text || !selectedUser) return;

    const chatKey = [currentUser, selectedUser].sort().join('-');
    if (!messages[chatKey]) messages[chatKey] = [];
    
    const message = {
        sender: currentUser,
        text,
        timestamp: new Date().toISOString()
    };
    
    messages[chatKey].push(message);
    localStorage.setItem('messages', JSON.stringify(messages));
    input.value = '';
    updateMessages();
}

function updateMessages() {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';

    if (!selectedUser) return;

    const chatKey = [currentUser, selectedUser].sort().join('-');
    const chatMessages = messages[chatKey] || [];

    chatMessages.forEach(msg => {
        const div = document.createElement('div');
        div.className = `message ${msg.sender === currentUser ? 'sent' : 'received'}`;
        div.textContent = `${msg.sender}: ${msg.text}`;
        messagesDiv.appendChild(div);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Event Listeners
document.getElementById('search-user').addEventListener('input', updateUserList);
document.getElementById('message-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Initialize
if (localStorage.getItem('currentUser')) {
    currentUser = localStorage.getItem('currentUser');
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('chat-screen').classList.remove('hidden');
    document.getElementById('current-user').textContent = currentUser;
    updateUserList();
                        }
