import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase Configuration
const supabaseUrl = 'https://opjyksksnccurdwyskiu.supabase.co'
const supabaseKey = 'sb_publishable_l7mKNQVJ6WesiTM4GJCxQg_oXxTN3it'
const supabase = createClient(supabaseUrl, supabaseKey)

// DOM Elements
const studentLoginCard = document.getElementById('studentLoginCard');
const signupForm = document.getElementById('signupForm');
const showSignupBtn = document.getElementById('showSignup');
const showLoginBtn = document.getElementById('showLogin');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const loaderOverlay = document.getElementById('loaderOverlay');

// Email validation - STRICT domain check
function isValidGordonEmail(email) {
    if (!email) return false;
    const trimmedEmail = email.trim().toLowerCase();
    return trimmedEmail.endsWith('@gordoncollege.edu.ph') && 
        trimmedEmail.length > '@gordoncollege.edu.ph'.length &&
        !trimmedEmail.includes(' ');
}

function showEmailError(inputElement, isValid) {
    if (isValid) {
        inputElement.classList.remove('domain-error');
        inputElement.style.borderColor = '#e2e8f0';
    } else {
        inputElement.classList.add('domain-error');
    }
}

function showLoader() {
    if (loaderOverlay) loaderOverlay.classList.add('show');
}

function hideLoader() {
    if (loaderOverlay) loaderOverlay.classList.remove('show');
}

function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${isError ? '#EF4444' : '#10B981'};
        color: white;
        padding: 12px 24px;
        border-radius: 40px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: fadeInUp 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function applySlideUpAnimation(element) {
    element.classList.remove('slideUp');
    void element.offsetWidth;
    element.classList.add('slideUp');
}

function togglePasswordVisibility(inputElement, toggleIcon) {
    if (!inputElement || !toggleIcon) return;
    toggleIcon.addEventListener('click', () => {
        const type = inputElement.getAttribute('type') === 'password' ? 'text' : 'password';
        inputElement.setAttribute('type', type);
        toggleIcon.classList.toggle('fa-eye');
        toggleIcon.classList.toggle('fa-eye-slash');
    });
}

// ========== UPDATE STUDENT STATUS TO ACTIVE ==========
async function updateStudentActivityOnLogin(studentEmail, studentId) {
    try {
        // Try to update status columns if they exist (won't error if they don't)
        const { error } = await supabase
            .from('student')
            .update({ 
                is_active: true,
                last_login: new Date().toISOString(),
                status: 'active'
            })
            .eq('email', studentEmail)
            .eq('student_id', studentId);
        
        if (error) {
            // Columns might not exist, that's fine
            console.log('Status columns not available, continuing login');
        }
        
        // Also update in localStorage students array (for admin panel)
        const storedStudents = localStorage.getItem('campus_care_students');
        if (storedStudents) {
            const students = JSON.parse(storedStudents);
            const studentIndex = students.findIndex(s => s.email === studentEmail);
            if (studentIndex !== -1) {
                students[studentIndex].status = 'active';
                students[studentIndex].last_login = new Date().toISOString();
                localStorage.setItem('campus_care_students', JSON.stringify(students));
            }
        }
        
        console.log(`✅ Student ${studentEmail} marked as ACTIVE`);
        return true;
    } catch (error) {
        console.error('Error updating student status:', error);
        return false;
    }
}

// Real-time email validation for login
const loginEmailInput = document.getElementById('loginEmail');
if (loginEmailInput) {
    loginEmailInput.addEventListener('input', function() {
        const isValid = isValidGordonEmail(this.value);
        showEmailError(this, isValid);
    });
}

// Real-time email validation for signup
const signupEmailInput = document.getElementById('signupEmail');
if (signupEmailInput) {
    signupEmailInput.addEventListener('input', function() {
        const isValid = isValidGordonEmail(this.value);
        showEmailError(this, isValid);
    });
}

// Toggle between Login and Signup forms
if (showSignupBtn) {
    showSignupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        studentLoginCard.style.display = 'none';
        signupForm.style.display = 'block';
        applySlideUpAnimation(signupForm);
    });
}

if (showLoginBtn) {
    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.style.display = 'none';
        studentLoginCard.style.display = 'block';
        applySlideUpAnimation(studentLoginCard);
    });
}

// Setup password toggles
const loginPasswordInput = document.getElementById('loginPassword');
const toggleLoginPassword = document.getElementById('toggleLoginPassword');
if (loginPasswordInput && toggleLoginPassword) {
    togglePasswordVisibility(loginPasswordInput, toggleLoginPassword);
}

const signupPasswordInput = document.getElementById('signupPassword');
const toggleSignupPassword = document.getElementById('toggleSignupPassword');
if (signupPasswordInput && toggleSignupPassword) {
    togglePasswordVisibility(signupPasswordInput, toggleSignupPassword);
}

// ========== LOGIN FUNCTION ==========
loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showNotification('Please fill in all fields', true);
        return;
    }

    if (!isValidGordonEmail(email)) {
        showNotification('Invalid Email Domain! Please use your @gordoncollege.edu.ph email address.', true);
        document.getElementById('loginEmail').classList.add('domain-error');
        return;
    }

    showLoader();

    try {
        // Sign in with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.user) throw new Error('Login failed - no user returned');

        // Get student data
        const { data: studentData, error: dbError } = await supabase
            .from('student')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (dbError || !studentData) {
            await supabase.auth.signOut();
            throw new Error('Account not found. Please sign up first.');
        }

        // ✅ UPDATE STATUS TO ACTIVE (if columns exist)
        await updateStudentActivityOnLogin(studentData.email, studentData.student_id);

        // Store student info
        const studentInfo = {
            name: studentData.full_name,
            studentId: studentData.student_id,
            email: studentData.email,
            userId: data.user.id,
            status: 'active'
        };
        localStorage.setItem('currentStudent', JSON.stringify(studentInfo));
        
        showNotification('Login successful! Redirecting...');
        
        setTimeout(() => {
            window.location.href = '/Assets/Student_dashboard/SDB.html';
        }, 500);

    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message || 'Login failed. Please check your credentials.', true);
        hideLoader();
    }
});

// ========== SIGNUP FUNCTION ==========
signupBtn.addEventListener('click', async () => {
    const fullName = document.getElementById('signupName').value.trim();
    const studentId = document.getElementById('signupStudentId').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;

    if (!fullName || !studentId || !email || !password) {
        showNotification('Please fill in all fields', true);
        return;
    }

    if (!isValidGordonEmail(email)) {
        showNotification('Invalid Email Domain! You must register with a @gordoncollege.edu.ph email address.', true);
        document.getElementById('signupEmail').classList.add('domain-error');
        return;
    }

    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', true);
        return;
    }

    showLoader();

    try {
        // Check if student ID already exists
        const { data: existingStudent } = await supabase
            .from('student')
            .select('student_id')
            .eq('student_id', studentId)
            .maybeSingle();

        if (existingStudent) {
            hideLoader();
            showNotification('Student ID already registered. Please login.', true);
            return;
        }

        // Check if email already exists
        const { data: existingEmail } = await supabase
            .from('student')
            .select('email')
            .eq('email', email)
            .maybeSingle();

        if (existingEmail) {
            hideLoader();
            showNotification('Email already registered. Please login.', true);
            return;
        }

        // Create auth user
        const { data, error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
                data: {
                    full_name: fullName,
                    student_id: studentId
                }
            }
        });
        
        if (error) throw error;
        if (!data.user) throw new Error('Signup failed.');

        // Insert into student table with ACTIVE status
        const { error: dbError } = await supabase
            .from('student')
            .insert([{ 
                id: data.user.id, 
                full_name: fullName, 
                student_id: studentId, 
                email: email,
                status: 'active',
                is_active: true,
                created_at: new Date().toISOString(),
                last_login: new Date().toISOString()
            }]);

        if (dbError) throw dbError;
        
        // Store student info
        const studentInfo = {
            name: fullName,
            studentId: studentId,
            email: email,
            userId: data.user.id,
            status: 'active'
        };
        localStorage.setItem('currentStudent', JSON.stringify(studentInfo));
        
        showNotification('Account created successfully! Redirecting...');
        
        setTimeout(() => {
            window.location.href = '/Assets/Student_dashboard/SDB.html';
        }, 500);

    } catch (error) {
        console.error('Signup error:', error);
        showNotification(error.message || 'Signup failed. Please try again.', true);
        hideLoader();
    }
});

// ========== LOGOUT FUNCTION ==========
window.studentLogout = async function() {
    try {
        const currentStudent = localStorage.getItem('currentStudent');
        if (currentStudent) {
            const student = JSON.parse(currentStudent);
            
            // Update status to INACTIVE (if columns exist)
            const { error } = await supabase
                .from('student')
                .update({ 
                    status: 'inactive',
                    is_active: false
                })
                .eq('email', student.email);
            
            if (error) {
                console.log('Status columns not available, continuing logout');
            } else {
                console.log('✅ Student status updated to INACTIVE');
            }
        }
        
        // Sign out from Supabase
        await supabase.auth.signOut();
        
        // Clear localStorage
        localStorage.removeItem('currentStudent');
        
        // Redirect to login page
        window.location.href = '/Assets/login/log.html';
        
    } catch (error) {
        console.error('Logout error:', error);
        localStorage.removeItem('currentStudent');
        window.location.href = '/Assets/login/log.html';
    }
};

// ========== FORGOT PASSWORD HANDLER ==========
const forgotPasswordBtn = document.getElementById('showForgotPassword');
if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', async () => {
        const email = prompt('Please enter your @gordoncollege.edu.ph email address to reset your password:');
        
        if (email) {
            if (!isValidGordonEmail(email)) {
                showNotification('Invalid email domain! Please use your @gordoncollege.edu.ph email.', true);
                return;
            }
            
            showLoader();
            try {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/reset-password.html'
                });
                if (error) throw error;
                showNotification('Password reset email sent! Check your inbox.');
            } catch (error) {
                showNotification(error.message || 'Failed to send reset email', true);
            }
            hideLoader();
        }
    });
}

// ========== ADD CSS STYLES ==========
function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .domain-error {
            border-color: #DC2626 !important;
            background-color: #FEF2F2 !important;
        }
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translate(-50%, 20px);
            }
            to {
                opacity: 1;
                transform: translate(-50%, 0);
            }
        }
        .slideUp {
            animation: slideUp 0.4s ease-out;
        }
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}

// ========== CHECK IF ALREADY LOGGED IN ==========
async function checkExistingSession() {
    const stored = localStorage.getItem('currentStudent');
    if (stored && window.location.pathname.includes('log.html')) {
        try {
            const student = JSON.parse(stored);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                window.location.href = '/Assets/Student_dashboard/SDB.html';
            }
        } catch(e) {
            console.log('Session check failed');
        }
    }
}

// ========== INITIALIZE ==========
function init() {
    addStyles();
    checkExistingSession();
    console.log('✅ Login page ready');
}

// Call init when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

console.log('✅ Login page script loaded. Status tracking is ACTIVE.');