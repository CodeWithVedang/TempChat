// Replace this with your own Firebase configuration from Firebase Console
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBcaSNQuZizwEo39oz5zpCirHyuSK78Htk",
  authDomain: "basic-curve-447915-i9.firebaseapp.com",
  projectId: "basic-curve-447915-i9",
  storageBucket: "basic-curve-447915-i9.firebasestorage.app",
  messagingSenderId: "824954986365",
  appId: "1:824954986365:web:fc974280d4da46ae1f3614",
  measurementId: "G-50LPQ2GDHK"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentUser = '';
let selectedUser = '';

function login() {
    const username = document.getElementById('username').value.trim();
    if (!username) return alert('Please enter a username');

    currentUser = username;
    // Add user to Firebase
    db.ref('users/' + username).set({
        username: username,
        lastSeen: new Date().toISOString()
    });

    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('chat-screen').classList.remove('hidden');
    document.getElementById('current-user').textContent = currentUser;
    updateUserList();
}

function logout() {
    if (currentUser) {
        db.ref('users/' + currentUser).remove();
    }
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

    db.ref('users').once('value', (snapshot) => {
        const users = snapshot.val() || {};
        Object.keys(users)
            .filter(user => user !== currentUser && user.toLowerCase().includes(searchTerm))
            .forEach(user => {
                const div = document.createElement('div');
                div.className = 'user-item';
                div.textContent = user;
                div.onclick = () => selectUser(user);
                userList.appendChild(div);
            });
    });
}

function selectUser(user) {
    selectedUser = user;
    document.getElementById('chat-header').textContent = `Chat with ${user}`;
    listenForMessages();
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    if (!text || !selectedUser) return;

    const chatKey = [currentUser, selectedUser].sort().join('-');
    const message = {
        sender: currentUser,
        text,
        timestamp: new Date().toISOString()
    };

    db.ref('messages/' + chatKey).push(message);
    input.value = '';
}

function listenForMessages() {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';

    if (!selectedUser) return;

    const chatKey = [currentUser, selectedUser].sort().join('-');
    db.ref('messages/' + chatKey).off(); // Remove previous listeners
    db.ref('messages/' + chatKey).on('value', (snapshot) => {
        messagesDiv.innerHTML = '';
        const messages = snapshot.val() || {};
        Object.values(messages).forEach(msg => {
            const div = document.createElement('div');
            div.className = `message ${msg.sender === currentUser ? 'sent' : 'received'}`;
            div.textContent = `${msg.sender}: ${msg.text}`;
            messagesDiv.appendChild(div);
        });
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

// Event Listeners
document.getElementById('search-user').addEventListener('input', updateUserList);
document.getElementById('message-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
