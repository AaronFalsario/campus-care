// Element selectors
const studentLoginCard = document.getElementById('studentLoginCard');
const adminLoginCard = document.getElementById('adminLoginCard');
const signupForm = document.getElementById('signupForm');
const showSignupBtn = document.getElementById('showSignup');
const showLoginBtn = document.getElementById('showLogin');
const signupPrompt = document.getElementById('signupPrompt');
const roleButtons = document.querySelectorAll('.role-selector button');

// slide-up animation
function applySlideUpAnimation(element) {
    element.classList.remove('slideUp');
    void element.offsetWidth;
    element.classList.add('slideUp');
}
window.addEventListener('load', function() {
    const header = document.querySelector('.header');
    const roleSelector = document.querySelector('.role-selector');
    if (header) applySlideUpAnimation(header);
    if (roleSelector) applySlideUpAnimation(roleSelector);
    if (studentLoginCard) applySlideUpAnimation(studentLoginCard);
});
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('passwordInput');
const toggleAdminPassword = document.getElementById('toggleAdminPassword');
const adminPasswordInput = document.getElementById('adminPasswordInput')
const toggleSignupPassword = document.getElementById('toggleSignupPassword');
const newPasswordInput = document.getElementById('new-password');

// Student to Admin role switching
roleButtons.forEach(button => {
    button.addEventListener('click', function() {
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
    showSignupBtn.addEventListener('click', function(e) {
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
    showLoginBtn.addEventListener('click', function(e) {
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

if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
}
if (toggleAdminPassword && adminPasswordInput) {
    toggleAdminPassword.addEventListener('click', function() {
        const type = adminPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        adminPasswordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
}

if (toggleSignupPassword && newPasswordInput) {
    toggleSignupPassword.addEventListener('click', function() {
        const type = newPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        newPasswordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
}