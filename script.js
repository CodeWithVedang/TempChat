// Firebase Configuration
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
const db = firebase.firestore();

let currentUser = '';
let selectedUser = '';

async function login() {
    const username = document.getElementById('username').value.trim();
    if (!username) return alert('Please enter a username');

    currentUser = username;
    // Add user to Firestore if not exists
    await db.collection('users').doc(username).set({
        username: username,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

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

async function updateUserList() {
    const searchTerm = document.getElementById('search-user').value.toLowerCase();
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';

    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => doc.data().username)
        .filter(user => user !== currentUser && user.toLowerCase().includes(searchTerm));

    users.forEach(user => {
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
    listenToMessages();
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    if (!text || !selectedUser) return;

    const chatKey = [currentUser, selectedUser].sort().join('-');
    await db.collection('messages').doc(chatKey).collection('chat').add({
        sender: currentUser,
        text,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    input.value = '';
}

function listenToMessages() {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';

    if (!selectedUser) return;

    const chatKey = [currentUser, selectedUser].sort().join('-');
    db.collection('messages').doc(chatKey).collection('chat')
        .orderBy('timestamp')
        .onSnapshot(snapshot => {
            messagesDiv.innerHTML = '';
            snapshot.forEach(doc => {
                const msg = doc.data();
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
