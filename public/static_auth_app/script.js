// Firebase Configuration
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_FIREBASE_API_KEY",
  authDomain: "inmarket-fcc70.firebaseapp.com",
  projectId: "inmarket-fcc70",
  storageBucket: "inmarket-fcc70.firebasestorage.app",
  messagingSenderId: "344261521436",
  appId: "1:344261521436:web:6b1607bbdd5b06cea5efd9"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// UI Elements
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const roleSelect = document.getElementById('role');
const authBtn = document.getElementById('auth-btn');
const formTitle = document.getElementById('form-title');
const authToggle = document.getElementById('auth-toggle');

let isLogin = true;

// Toggle Login/Register
authToggle.addEventListener('click', () => {
    isLogin = !isLogin;
    formTitle.innerText = isLogin ? "Login" : "Daftar";
    authBtn.innerText = isLogin ? "Masuk" : "Daftar";
    authToggle.innerText = isLogin ? "Belum punya akun? Daftar" : "Sudah punya akun? Login";
    roleSelect.classList.toggle('hidden', isLogin);
});

// Authentication Handler
authBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    const rawRole = roleSelect.value;
    const standardizedRoleForDb = rawRole.toLowerCase(); // 'owner' or 'employee'

    if (isLogin) {
        auth.signInWithEmailAndPassword(email, password)
            .then(handleRedirection)
            .catch(err => alert(err.message));
    } else {
        auth.createUserWithEmailAndPassword(email, password)
            .then(userCred => {
                // Save role to Firestore
                db.collection('users').doc(userCred.user.uid).set({
                    uid: userCred.user.uid,
                    email: email,
                    role: standardizedRoleForDb,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(handleRedirection);
            })
            .catch(err => alert(err.message));
    }
});

// Redirect based on role
function handleRedirection(userCred) {
    const user = userCred.user || auth.currentUser;
    db.collection('users').doc(user.uid).get().then(doc => {
        const data = doc.data();
        const role = data.role; // 'owner' or 'employee'
        
        // Save session locally to sync with main app
        const sessionUser = {
            uid: user.uid,
            email: user.email,
            role: role === 'owner' ? 'Owner' : 'Employee',
            businessId: role === 'owner' ? "bus_" + user.uid : null
        };
        localStorage.setItem('offline_logged_in_user', JSON.stringify(sessionUser));
        localStorage.setItem('inmarket_user_role', sessionUser.role);

        window.location.href = '/dashboard';
    });
}
