/// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBcaSNQuZizwEo39oz5zpCirHyuSK78Htk",
    authDomain: "basic-curve-447915-i9.firebaseapp.com",
    databaseURL: "https://basic-curve-447915-i9-default-rtdb.firebaseio.com",
    projectId: "basic-curve-447915-i9",
    storageBucket: "basic-curve-447915-i9.firebasestorage.app",
    messagingSenderId: "824954986365",
    appId: "1:824954986365:web:fc974280d4da46ae1f3614",
    measurementId: "G-50LPQ2GDHK"
  };
// Initialize Firebase only if loaded
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    let currentUser = null;
    let selectedUser = null;

    function login() {
        const username = document.getElementById('usernameInput').value.trim();
        if (username) {
            currentUser = username;
            db.ref('users/' + username).set({ active: true });
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('chatPage').style.display = 'flex';
            updateUserList();
            listenForMessages();
        }
    }

    function logout() {
        if (currentUser) {
            db.ref('users/' + currentUser).remove();
        }
        currentUser = null;
        selectedUser = null;
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('chatPage').style.display = 'none';
        document.getElementById('usernameInput').value = '';
    }

    function updateUserList(searchTerm = '') {
        const userList = document.getElementById('userList');
        userList.innerHTML = '';
        db.ref('users').once('value', snapshot => {
            const users = snapshot.val() || {};
            const filteredUsers = Object.keys(users)
                .filter(user => user !== currentUser && user.toLowerCase().includes(searchTerm.toLowerCase()));
            
            filteredUsers.forEach(user => {
                const div = document.createElement('div');
                div.className = 'user-item';
                div.textContent = user;
                div.onclick = () => selectUser(user);
                if (user === selectedUser) div.classList.add('active');
                userList.appendChild(div);
            });
        });
    }

    function searchUsers() {
        const searchTerm = document.getElementById('searchInput').value;
        updateUserList(searchTerm);
    }

    function selectUser(user) {
        selectedUser = user;
        document.getElementById('chatHeader').textContent = user;
        updateUserList();
        loadMessages();
    }

    function loadMessages() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '';
        const chatKey = [currentUser, selectedUser].sort().join(':');
        
        db.ref('messages/' + chatKey).on('value', snapshot => {
            const messages = snapshot.val() || {};
            Object.values(messages).forEach(msg => {
                const div = document.createElement('div');
                div.className = `message ${msg.from === currentUser ? 'sent' : 'received'}`;
                div.textContent = msg.text;
                chatMessages.appendChild(div);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }

    function sendMessage() {
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        if (text && selectedUser) {
            const chatKey = [currentUser, selectedUser].sort().join(':');
            const message = {
                from: currentUser,
                to: selectedUser,
                text,
                timestamp: Date.now()
            };
            db.ref('messages/' + chatKey).push(message);
            input.value = '';
        }
    }

    function listenForMessages() {
        db.ref('messages').on('child_changed', () => {
            if (selectedUser) loadMessages();
        });
    }
} else {
    console.error("Firebase SDK not loaded.");
}