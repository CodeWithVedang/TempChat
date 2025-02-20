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
let isFirebaseInitialized = false;

function initializeApp() {
    console.log('Starting app initialization...');
    
    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
        alert('Firebase is undefined. Check if firebase-app.js and firebase-firestore.js are correctly included.');
        console.error('Firebase not defined');
        return;
    }
    console.log('Firebase object detected');

    // Initialize Firebase
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        isFirebaseInitialized = true;
        alert('Firebase initialized successfully.');
        console.log('Firebase initialized');
    } catch (error) {
        alert('Error initializing Firebase: ' + error.message);
        console.error('Firebase initialization error:', error);
        return;
    }

    // Initial DOM check
    if (document.getElementById('username')) {
        alert('Page loaded successfully.');
        console.log('DOM elements found');
    } else {
        alert('Error: DOM elements not found.');
        console.error('DOM elements missing');
    }
}

async function login() {
    if (!isFirebaseInitialized || !db) {
        alert('Firebase is not initialized. Check console for details.');
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
        console.log(`User ${username} logged in`);
    } catch (error) {
        alert('Error saving user to Firestore: ' + error.message);
        console.error('Login error:', error);
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
    console.log(`User ${currentUser} logged out`);
    currentUser = '';
    selectedUser = '';
    document.getElementById('chat-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('username').value = '';
}

async function updateUserList() {
    if (!isFirebaseInitialized || !db) {
        alert('Firebase is not initialized.');
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
        console.log('User list updated');
    } catch (error) {
        alert('Error fetching users: ' + error.message);
        console.error('User list error:', error);
    }
}

function selectUser(user) {
    if (unsubscribeMessages) unsubscribeMessages();
    selectedUser = user;
    document.getElementById('chat-header').textContent = `Chat with ${user}`;
    alert(`Selected user: ${user}`);
    console.log(`Selected user: ${user}`);
    listenToMessages();
}

async function sendMessage() {
    if (!isFirebaseInitialized || !db) {
        alert('Firebase is not initialized.');
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
        console.log('Message sent:', text);
        input.value = '';
    } catch (error) {
        alert('Error sending message: ' + error.message);
        console.error('Send message error:', error);
    }
}

function listenToMessages() {
    if (!isFirebaseInitialized || !db) {
        alert('Firebase is not initialized.');
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
                console.log('Messages updated');
            }, error => {
                alert('Error listening to messages: ' + error.message);
                console.error('Listen error:', error);
            });
    } catch (error) {
        alert('Error setting up message listener: ' + error.message);
        console.error('Listener setup error:', error);
    }
}

// Event Listeners
document.getElementById('search-user').addEventListener('input', updateUserList);
document.getElementById('message-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// Start the app
initializeApp();
