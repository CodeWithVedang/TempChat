// Function to load Firebase SDK dynamically
function loadFirebase() {
    return new Promise((resolve, reject) => {
        const appScript = document.createElement('script');
        appScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
        appScript.onload = () => {
            const firestoreScript = document.createElement('script');
            firestoreScript.src = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
            firestoreScript.onload = () => resolve();
            firestoreScript.onerror = () => reject(new Error('Failed to load Firebase Firestore SDK'));
            document.body.appendChild(firestoreScript);
        };
        appScript.onerror = () => reject(new Error('Failed to load Firebase App SDK'));
        document.body.appendChild(appScript);
    });
}

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

let db;
let currentUser = '';
let selectedUser = '';
let unsubscribeMessages = null;

async function initializeApp() {
    try {
        await loadFirebase();
        alert('Firebase SDK loaded successfully.');
        firebase.initializeApp(firebaseConfig);
        alert('Firebase initialized successfully.');
        db = firebase.firestore();
    } catch (error) {
        alert('Error loading Firebase: ' + error.message);
        return;
    }

    // Initial DOM check
    if (document.getElementById('username')) {
        alert('Page loaded successfully.');
    } else {
        alert('Error: DOM elements not found.');
    }
}

async function login() {
    if (!db) {
        alert('Firebase not initialized yet. Please wait.');
        return;
    }

    const username = document.getElementById('username').value.trim();
    if (!username) {
        alert('Please enter a username.');
        return;
    }

    currentUser = username;
    try {
        await db.collection('users').doc(username).set({
            username: username,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        alert(`Logged in as ${username}`);
    } catch (error) {
        alert('Error saving user to Firestore: ' + error.message);
        return;
    }

    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('chat-screen').classList.remove('hidden');
    document.getElementById('current-user').textContent = currentUser;
    updateUserList();
}

function logout() {
    if (unsubscribeMessages) unsubscribeMessages();
    alert(`Logged out from ${currentUser}`);
    currentUser = '';
    selectedUser = '';
    document.getElementById('chat-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('username').value = '';
}

async function updateUserList() {
    if (!db) {
        alert('Firebase not initialized.');
        return;
    }

    const searchTerm = document.getElementById('search-user').value.toLowerCase();
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';

    try {
        const snapshot = await db.collection('users').get();
        const users = snapshot.docs.map(doc => doc.data().username)
            .filter(user => user !== currentUser && user.toLowerCase().includes(searchTerm));
        
        if (users.length === 0) {
            alert('No matching users found.');
        } else {
            alert(`Found ${users.length} users.`);
        }

        users.forEach(user => {
            const div = document.createElement('div');
            div.className = 'user-item';
            div.textContent = user;
            div.onclick = () => selectUser(user);
            userList.appendChild(div);
        });
    } catch (error) {
        alert('Error fetching users: ' + error.message);
    }
}

function selectUser(user) {
    if (unsubscribeMessages) unsubscribeMessages();
    selectedUser = user;
    document.getElementById('chat-header').textContent = `Chat with ${user}`;
    alert(`Selected user: ${user}`);
    listenToMessages();
}

async function sendMessage() {
    if (!db) {
        alert('Firebase not initialized.');
        return;
    }

    const input = document.getElementById('message-input');
    const text = input.value.trim();
    if (!text) {
        alert('Please enter a message.');
        return;
    }
    if (!selectedUser) {
        alert('Please select a user to chat with.');
        return;
    }

    const chatKey = [currentUser, selectedUser].sort().join('-');
    try {
        await db.collection('messages').doc(chatKey).collection('chat').add({
            sender: currentUser,
            text,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('Message sent successfully.');
        input.value = '';
    } catch (error) {
        alert('Error sending message: ' + error.message);
    }
}

function listenToMessages() {
    if (!db) {
        alert('Firebase not initialized.');
        return;
    }

    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';

    if (!selectedUser) {
        alert('No user selected for chat.');
        return;
    }

    const chatKey = [currentUser, selectedUser].sort().join('-');
    try {
        unsubscribeMessages = db.collection('messages').doc(chatKey).collection('chat')
            .orderBy('timestamp')
            .onSnapshot(snapshot => {
                messagesDiv.innerHTML = '';
                if (snapshot.empty) {
                    alert('No messages yet in this chat.');
                } else {
                    alert(`Loaded ${snapshot.size} messages.`);
                }
                snapshot.forEach(doc => {
                    const msg = doc.data();
                    const div = document.createElement('div');
                    div.className = `message ${msg.sender === currentUser ? 'sent' : 'received'}`;
                    div.textContent = `${msg.sender}: ${msg.text}`;
                    messagesDiv.appendChild(div);
                });
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }, error => {
                alert('Error listening to messages: ' + error.message);
            });
    } catch (error) {
        alert('Error setting up message listener: ' + error.message);
    }
}

// Event Listeners
document.getElementById('search-user').addEventListener('input', updateUserList);
document.getElementById('message-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Start the app
initializeApp();
