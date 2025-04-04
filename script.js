// Your Firebase configuration
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

if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.database();

    let currentUser = null;
    let selectedUser = null;
    let isActive = false;
    let activityTimeout;

    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('registerBtn').addEventListener('click', register);
        document.getElementById('showLoginLink').addEventListener('click', (e) => {
            e.preventDefault();
            showLogin();
        });
        document.getElementById('loginBtn').addEventListener('click', login);
        document.getElementById('showRegisterLink').addEventListener('click', (e) => {
            e.preventDefault();
            showRegister();
        });
        document.getElementById('logoutBtn').addEventListener('click', logout);
        document.getElementById('sendBtn').addEventListener('click', sendMessage);
        document.getElementById('profileBtn').addEventListener('click', showProfilePopup);
        document.getElementById('closePopupBtn').addEventListener('click', closeProfilePopup);
        document.getElementById('closeUserPopupBtn').addEventListener('click', closeUserInfoPopup);
        document.getElementById('backBtn').addEventListener('click', showChatList);

        checkAuthState();
        setupActivityListeners();
    });

    function checkAuthState() {
        const storedUser = JSON.parse(localStorage.getItem('currentUser'));
        auth.onAuthStateChanged(async (user) => {
            if (user && storedUser) {
                const snapshot = await db.ref('users/' + user.uid).once('value');
                const userData = snapshot.val();
                if (userData && userData.username === storedUser.username) {
                    currentUser = userData.username;
                    document.getElementById('loginPage').style.display = 'none';
                    document.getElementById('registerPage').style.display = 'none';
                    document.getElementById('appPage').style.display = 'block';
                    setupUserPresence(user.uid);
                    updateUserList();
                    listenForMessages();
                } else {
                    localStorage.removeItem('currentUser');
                    showLogin();
                }
            } else {
                localStorage.removeItem('currentUser');
                showLogin();
            }
        });
    }

    function showRegister() {
        document.getElementById('registerPage').style.display = 'block';
        document.getElementById('loginPage').style.display = 'none';
    }

    function showLogin() {
        document.getElementById('registerPage').style.display = 'none';
        document.getElementById('loginPage').style.display = 'block';
    }

    async function register() {
        const name = document.getElementById('regName').value.trim();
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value.trim();

        if (!name || !username || !password) {
            alert("Please fill in all fields.");
            return;
        }

        try {
            const email = `${username}@chatapp.com`;
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const uid = userCredential.user.uid;

            await db.ref('users/' + uid).set({
                username,
                name,
                active: false // Initially offline until login
            });

            alert("Registration successful! Please login.");
            showLogin();
            document.getElementById('regName').value = '';
            document.getElementById('regUsername').value = '';
            document.getElementById('regPassword').value = '';
        } catch (error) {
            alert(`Registration failed: ${error.message}`);
        }
    }

    async function login() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        if (!username || !password) {
            alert("Please enter username and password.");
            return;
        }

        try {
            const email = `${username}@chatapp.com`;
            await auth.signInWithEmailAndPassword(email, password);
            auth.onAuthStateChanged(async (user) => {
                if (user) {
                    const snapshot = await db.ref('users/' + user.uid).once('value');
                    const userData = snapshot.val();
                    currentUser = userData.username;

                    setupUserPresence(user.uid);

                    localStorage.setItem('currentUser', JSON.stringify({
                        username: userData.username,
                        name: userData.name
                    }));

                    document.getElementById('loginPage').style.display = 'none';
                    document.getElementById('registerPage').style.display = 'none';
                    document.getElementById('appPage').style.display = 'block';
                    updateUserList();
                    listenForMessages();
                }
            });
        } catch (error) {
            alert(`Login failed: ${error.message}`);
        }
    }

    async function logout() {
        try {
            if (currentUser && auth.currentUser) {
                await db.ref('users/' + auth.currentUser.uid).update({ active: false });
            }
            await auth.signOut();
            currentUser = null;
            selectedUser = null;
            isActive = false;
            localStorage.removeItem('currentUser');
            document.getElementById('appPage').style.display = 'none';
            document.getElementById('loginPage').style.display = 'block';
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginPassword').value = '';
        } catch (error) {
            alert(`Logout failed: ${error.message}`);
        }
    }

    function setupUserPresence(uid) {
        const userRef = db.ref('users/' + uid);
        userRef.onDisconnect().update({ active: false }); // Set offline on disconnect

        // Update status based on activity
        if (document.visibilityState === 'visible') {
            isActive = true;
            userRef.update({ active: true });
        }

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && currentUser) {
                isActive = true;
                userRef.update({ active: true });
            } else {
                isActive = false;
                clearTimeout(activityTimeout);
                userRef.update({ active: false });
            }
        });
    }

    function setupActivityListeners() {
        const events = ['mousemove', 'keydown', 'scroll', 'click'];
        events.forEach(event => {
            document.addEventListener(event, () => {
                if (currentUser && auth.currentUser && document.visibilityState === 'visible') {
                    isActive = true;
                    db.ref('users/' + auth.currentUser.uid).update({ active: true });
                    clearTimeout(activityTimeout);
                    activityTimeout = setTimeout(() => {
                        if (document.visibilityState === 'visible') {
                            isActive = false;
                            db.ref('users/' + auth.currentUser.uid).update({ active: false });
                        }
                    }, 30000); // 30 seconds inactivity timeout
                }
            });
        });
    }

    function updateUserList(searchTerm = '') {
        const userList = document.getElementById('userList');
        userList.innerHTML = '';
        db.ref('users').once('value', snapshot => {
            const users = snapshot.val() || {};
            const filteredUsers = Object.values(users)
                .filter(user => 
                    user && 
                    typeof user.username === 'string' && 
                    user.username !== currentUser && 
                    user.username.toLowerCase().includes(searchTerm.toLowerCase())
                );

            filteredUsers.forEach(user => {
                const div = document.createElement('div');
                div.className = 'user-item';
                div.textContent = `${user.username} (${user.name || 'Unknown'})`;
                div.onclick = () => {
                    selectUser(user.username);
                    if (window.innerWidth <= 768) {
                        showChatArea();
                    }
                };

                div.oncontextmenu = (e) => {
                    e.preventDefault();
                    showUserInfoPopup(user.username, user.name || 'Unknown', e.clientX, e.clientY);
                };

                let touchTimer;
                div.addEventListener('touchstart', (e) => {
                    touchTimer = setTimeout(() => {
                        const touch = e.touches[0];
                        showUserInfoPopup(user.username, user.name || 'Unknown', touch.clientX, touch.clientY);
                    }, 500);
                });
                div.addEventListener('touchend', () => clearTimeout(touchTimer));
                div.addEventListener('touchmove', () => clearTimeout(touchTimer));

                if (user.username === selectedUser) div.classList.add('active');
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
        document.getElementById('chatUsername').textContent = user;
        updateUserStatus(user);
        updateUserList();
        loadMessages();

        db.ref('users').orderByChild('username').equalTo(user).on('value', snapshot => {
            const userData = snapshot.val();
            if (userData) {
                const uid = Object.keys(userData)[0];
                const status = userData[uid].active ? 'Online' : 'Offline';
                updateUserStatus(user, status);
            }
        });
    }

    function updateUserStatus(username, status) {
        const statusElement = document.getElementById('userStatus');
        if (selectedUser === username) {
            statusElement.textContent = status || 'Loading...';
            statusElement.className = 'user-status';
            statusElement.classList.add(status === 'Online' ? 'online' : 'offline');
        }
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
            db.ref('messages/' + chatKey).push(message)
                .then(() => input.value = '')
                .catch(error => alert(`Failed to send message: ${error.message}`));
        }
    }

    function listenForMessages() {
        db.ref('messages').on('child_changed', () => {
            if (selectedUser) loadMessages();
        });
    }

    function showChatArea() {
        document.getElementById('chatArea').classList.add('active');
        document.getElementById('sidebar').style.transform = 'translateX(-100%)';
    }

    function showChatList() {
        document.getElementById('chatArea').classList.remove('active');
        document.getElementById('sidebar').style.transform = 'translateX(0)';
    }

    function showProfilePopup() {
        const storedUser = JSON.parse(localStorage.getItem('currentUser'));
        if (storedUser) {
            document.getElementById('popupUsername').textContent = storedUser.username;
            document.getElementById('popupName').textContent = storedUser.name;
            document.getElementById('profilePopup').style.display = 'flex';
        }
    }

    function closeProfilePopup() {
        document.getElementById('profilePopup').style.display = 'none';
    }

    function showUserInfoPopup(username, name, x, y) {
        document.getElementById('userPopupUsername').textContent = username;
        document.getElementById('userPopupName').textContent = name;
        const popup = document.getElementById('userInfoPopup');
        popup.style.display = 'flex';
        popup.style.top = `${y}px`;
        popup.style.left = `${x}px`;
        adjustPopupPosition(popup);
    }

    function closeUserInfoPopup() {
        document.getElementById('userInfoPopup').style.display = 'none';
    }

    function adjustPopupPosition(popup) {
        const rect = popup.getBoundingClientRect();
        if (rect.bottom > window.innerHeight) {
            popup.style.top = `${window.innerHeight - rect.height}px`;
        }
        if (rect.right > window.innerWidth) {
            popup.style.left = `${window.innerWidth - rect.width}px`;
        }
    }
} else {
    console.error("Firebase SDK not loaded.");
}