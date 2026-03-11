import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ELEMENT SELECTORS
const studentLoginCard = document.getElementById('studentLoginCard');
const adminLoginCard = document.getElementById('adminLoginCard');
const signupForm = document.getElementById('signupForm');
const showSignupBtn = document.getElementById('showSignup');
const showLoginBtn = document.getElementById('showLogin');
const roleButtons = document.querySelectorAll('.role-selector button');


// SLIDE-UP ANIMATION
function applySlideUpAnimation(element) {
    element.classList.remove('slideUp');
    void element.offsetWidth;
    element.classList.add('slideUp');
}

window.addEventListener('load', function () {
    const header = document.querySelector('.header');
    const roleSelector = document.querySelector('.role-selector');
    if (header) applySlideUpAnimation(header);
    if (roleSelector) applySlideUpAnimation(roleSelector);
    if (studentLoginCard) applySlideUpAnimation(studentLoginCard);
});


// PASSWORD TOGGLES
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('passwordInput');
const toggleAdminPassword = document.getElementById('toggleAdminPassword');
const adminPasswordInput = document.getElementById('adminPasswordInput');
const toggleSignupPassword = document.getElementById('toggleSignupPassword');
const newPasswordInput = document.getElementById('new-password');

if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
}
if (toggleAdminPassword && adminPasswordInput) {
    toggleAdminPassword.addEventListener('click', function () {
        const type = adminPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        adminPasswordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
}
if (toggleSignupPassword && newPasswordInput) {
    toggleSignupPassword.addEventListener('click', function () {
        const type = newPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        newPasswordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
}

// ROLE SWITCHER
roleButtons.forEach(button => {
    button.addEventListener('click', function () {
        const role = this.getAttribute('data-role');
        roleButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        this.style.animation = 'none';
        void this.offsetWidth;
        this.style.animation = '';
        signupForm.style.display = 'none';

        if (role === 'admin') {
            studentLoginCard.style.display = 'none';
            adminLoginCard.style.display = 'block';
            adminLoginCard.classList.remove('slideInLeft');
            void adminLoginCard.offsetWidth;
            adminLoginCard.classList.add('slideInRight', 'slideUp');
            document.body.classList.add('admin-role');
        } else {
            studentLoginCard.style.display = 'block';
            adminLoginCard.style.display = 'none';
            studentLoginCard.classList.remove('slideInRight');
            void studentLoginCard.offsetWidth;
            studentLoginCard.classList.add('slideInLeft', 'slideUp');
            document.body.classList.remove('admin-role');
        }
    });
});

if (showSignupBtn) {
    showSignupBtn.addEventListener('click', function (e) {
        e.preventDefault();
        studentLoginCard.style.display = 'none';
        adminLoginCard.style.display = 'none';
        signupForm.style.display = 'block';
        signupForm.classList.add('visible');
        roleButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.disabled = true;
        });
        roleButtons[0].classList.add('active');
        roleButtons[1].style.display = 'none';
        document.body.classList.remove('admin-role');
        applySlideUpAnimation(signupForm);
    });
}

if (showLoginBtn) {
    showLoginBtn.addEventListener('click', function (e) {
        e.preventDefault();
        signupForm.style.display = 'none';
        signupForm.classList.remove('visible');
        studentLoginCard.style.display = 'block';
        adminLoginCard.style.display = 'none';
        roleButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.disabled = false;
        });
        roleButtons[0].classList.add('active');
        roleButtons[1].style.display = 'block';
        document.body.classList.remove('admin-role');
        applySlideUpAnimation(studentLoginCard);
    });
}

function showError(cardId, message) {
    const card = document.getElementById(cardId);
    let errorEl = card.querySelector('.error-msg');
    if (!errorEl) {
        errorEl = document.createElement('p');
        errorEl.className = 'error-msg';
        errorEl.style.cssText = 'color:#ef4444;font-size:13px;text-align:center;margin-top:10px;';
        card.querySelector('.login-btn, button[type="submit"]').insertAdjacentElement('afterend', errorEl);
    }
    errorEl.textContent = message;
}

function clearError(cardId) {
    const card = document.getElementById(cardId);
    const errorEl = card.querySelector('.error-msg');
    if (errorEl) errorEl.textContent = '';
}

//Student Sign in Functionality
const studentLoginBtn = studentLoginCard.querySelector('.login-btn');
studentLoginBtn.addEventListener('click', async function () {
    clearError('studentLoginCard');
    const email = studentLoginCard.querySelector('input[type="email"]').value.trim();
    const password = studentLoginCard.querySelector('input[type="password"]').value;

    if (!email || !password) {
        showError('studentLoginCard', 'Please fill in all fields.');
        return;
    }

    studentLoginBtn.textContent = 'Logging in...';
    studentLoginBtn.disabled = true;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.role === 'student') {
                window.location.href = '/STUDENT/dashboard.html';
            } else {
                showError('studentLoginCard', 'This account is not a student account.');
                await signOut(auth);
            }
        } else {
            showError('studentLoginCard', 'Account not found. Please sign up.');
        }
    } catch (error) {
        showError('studentLoginCard', friendlyError(error.code));
    } finally {
        studentLoginBtn.textContent = 'Login';
        studentLoginBtn.disabled = false;
    }
});

//Admin login
const adminLoginBtn = adminLoginCard.querySelector('.login-btn');
adminLoginBtn.addEventListener('click', async function () {
    clearError('adminLoginCard');
    const email = adminLoginCard.querySelector('input[type="email"]').value.trim();
    const password = adminLoginCard.querySelector('input[type="password"]').value;

    if (!email || !password) {
        showError('adminLoginCard', 'Please fill in all fields.');
        return;
    }

    adminLoginBtn.textContent = 'Logging in...';
    adminLoginBtn.disabled = true;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.role === 'admin') {
                window.location.href = '/ADMIN/dashboard.html';
            } else {
                showError('adminLoginCard', 'This account is not an admin account.');
                await signOut(auth);
            }
        } else {
            showError('adminLoginCard', 'Admin account not found.');
        }
    } catch (error) {
        showError('adminLoginCard', friendlyError(error.code));
    } finally {
        adminLoginBtn.textContent = 'Login';
        adminLoginBtn.disabled = false;
    }
});

//Sign up Functionality
const signupFormEl = document.getElementById('signupForm');
signupFormEl.addEventListener('submit', async function (e) {
    e.preventDefault();
    const card = signupFormEl.querySelector('.login-card');

    const fullName = card.querySelector('input[type="text"]').value.trim();
    const studentId = card.querySelectorAll('input[type="text"]')[1].value.trim();
    const email = card.querySelector('input[type="email"]').value.trim();
    const password = card.querySelector('input[type="password"]').value;

    if (!fullName || !studentId || !email || !password) {
        showError('signupForm', 'Please fill in all fields.');
        return;
    }

    if (password.length < 6) {
        showError('signupForm', 'Password must be at least 6 characters.');
        return;
    }

    const signupBtn = card.querySelector('button[type="submit"]');
    signupBtn.textContent = 'Creating account...';
    signupBtn.disabled = true;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
//Database entry for new user
        await setDoc(doc(db, 'users', uid), {
            fullName,
            studentId,
            email,
            role: 'student',
            createdAt: new Date().toISOString()
        });

        window.location.href = '/STUDENT/dashboard.html';
    } catch (error) {
        showError('signupForm', friendlyError(error.code));
    } finally {
        signupBtn.textContent = 'Sign Up';
        signupBtn.disabled = false;
    }
});

//Friendly error messages
function friendlyError(code) {
    switch (code) {
        case 'auth/invalid-email': return 'Invalid email address.';
        case 'auth/user-not-found': return 'No account found with this email.';
        case 'auth/wrong-password': return 'Incorrect password.';
        case 'auth/invalid-credential': return 'Incorrect email or password.';
        case 'auth/email-already-in-use': return 'This email is already registered.';
        case 'auth/weak-password': return 'Password must be at least 6 characters.';
        case 'auth/too-many-requests': return 'Too many attempts. Please try again later.';
        case 'auth/network-request-failed': return 'Network error. Check your connection.';
        default: return 'Something went wrong. Please try again.';
    }
}