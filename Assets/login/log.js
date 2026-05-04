import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
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

// ========== BEAUTIFUL TOAST NOTIFICATION ==========
function showNotification(message, isError = false, duration = 3000) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.custom-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast container
    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    
    // Create icon based on type
    const icon = document.createElement('div');
    icon.className = 'toast-icon';
    if (isError) {
        icon.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <circle cx="12" cy="16" r="1" fill="currentColor"/>
            </svg>
        `;
    } else {
        icon.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            </svg>
        `;
    }
    
    // Create message container
    const messageContainer = document.createElement('div');
    messageContainer.className = 'toast-message';
    messageContainer.textContent = message;
    
    // Create progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'toast-progress';
    
    toast.appendChild(icon);
    toast.appendChild(messageContainer);
    toast.appendChild(progressBar);
    document.body.appendChild(toast);
    
    // Add styles if not already added
    if (!document.querySelector('#toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .custom-toast {
                position: fixed;
                bottom: 24px;
                left: 16px;
                right: 16px;
                max-width: 400px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                padding: 14px 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.05);
                z-index: 10000;
                animation: toastSlideUp 0.3s ease-out;
                border-left: 4px solid;
                border-left-color: ${isError ? '#EF4444' : '#10B981'};
            }
            
            .custom-toast .toast-icon {
                flex-shrink: 0;
                color: ${isError ? '#EF4444' : '#10B981'};
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .custom-toast .toast-message {
                flex: 1;
                font-size: 13px;
                font-weight: 500;
                color: #1e293b;
                line-height: 1.4;
            }
            
            .custom-toast .toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: ${isError ? '#EF4444' : '#10B981'};
                border-radius: 0 0 0 12px;
                animation: toastProgress ${duration}ms linear forwards;
            }
            
            @keyframes toastSlideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes toastProgress {
                from {
                    width: 100%;
                }
                to {
                    width: 0%;
                }
            }
            
            @media (max-width: 480px) {
                .custom-toast {
                    left: 12px;
                    right: 12px;
                    padding: 12px 14px;
                    bottom: 20px;
                }
                
                .custom-toast .toast-message {
                    font-size: 12px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Auto remove after duration
    setTimeout(() => {
        toast.style.animation = 'toastSlideUp 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
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

// ========== CHECK IF EMAIL EXISTS IN DATABASE ==========
async function checkEmailExists(email) {
    try {
        const { data, error } = await supabase
            .from('student')
            .select('email, full_name')
            .eq('email', email.toLowerCase().trim())
            .maybeSingle();
        
        if (error) {
            console.error('Error checking email:', error);
            return { exists: false, error: error.message };
        }
        
        return { exists: !!data, userData: data };
    } catch (error) {
        console.error('Email check failed:', error);
        return { exists: false, error: error.message };
    }
}

// ========== UPDATE STUDENT STATUS TO ACTIVE ==========
async function updateStudentActivityOnLogin(studentEmail, studentId) {
    try {
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
            console.log('Status columns not available, continuing login');
        }
        
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
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.user) throw new Error('Login failed - no user returned');

        const { data: studentData, error: dbError } = await supabase
            .from('student')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (dbError || !studentData) {
            await supabase.auth.signOut();
            throw new Error('Account not found. Please sign up first.');
        }

        await updateStudentActivityOnLogin(studentData.email, studentData.student_id);

        const studentInfo = {
            name: studentData.full_name,
            studentId: studentData.student_id,
            email: studentData.email,
            userId: data.user.id,
            status: 'active'
        };
        localStorage.setItem('currentStudent', JSON.stringify(studentInfo));
        
        showNotification('Login successful! Redirecting...', false, 1500);
        
        setTimeout(() => {
            window.location.href = '/Assets/Student_dashboard/SDB.html';
        }, 1500);

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
        
        const studentInfo = {
            name: fullName,
            studentId: studentId,
            email: email,
            userId: data.user.id,
            status: 'active'
        };
        localStorage.setItem('currentStudent', JSON.stringify(studentInfo));
        
        showNotification('Account created successfully! Redirecting...', false, 1500);
        
        setTimeout(() => {
            window.location.href = '/Assets/Student_dashboard/SDB.html';
        }, 1500);

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
        
        await supabase.auth.signOut();
        localStorage.removeItem('currentStudent');
        window.location.href = '/Assets/login/log.html';
        
    } catch (error) {
        console.error('Logout error:', error);
        localStorage.removeItem('currentStudent');
        window.location.href = '/Assets/login/log.html';
    }
};

// ========== FORGOT PASSWORD HANDLER (WITH EMAIL EXISTENCE CHECK) ==========
const forgotPasswordBtn = document.getElementById('showForgotPassword');
if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', async () => {
        // Show custom email prompt
        const email = await showEmailPrompt();
        
        if (email && email.trim()) {
            const trimmedEmail = email.trim().toLowerCase();
            
            // First validate domain
            if (!isValidGordonEmail(trimmedEmail)) {
                showNotification('Invalid email domain! Please use your @gordoncollege.edu.ph email.', true);
                return;
            }
            
            showLoader();
            
            try {
                // CHECK IF EMAIL EXISTS IN DATABASE FIRST
                const { exists, userData, error: checkError } = await checkEmailExists(trimmedEmail);
                
                if (checkError) {
                    throw new Error('Unable to verify email. Please try again.');
                }
                
                if (!exists) {
                    hideLoader();
                    showNotification('❌ Email not found. Please sign up first or use a registered email.', true, 4000);
                    return;
                }
                
                // Email exists, send reset link
                console.log(`✅ Email verified: ${trimmedEmail} belongs to ${userData?.full_name}`);
                
                const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
                    redirectTo: `${window.location.origin}/Assets/login/reset-password.html`
                });
                
                if (error) throw error;
                
                showNotification(`✅ Password reset email sent to ${trimmedEmail}! Check your inbox.`, false, 5000);
                
            } catch (error) {
                console.error('Password reset error:', error);
                showNotification(error.message || 'Failed to send reset email. Please try again.', true);
            } finally {
                hideLoader();
            }
        }
    });
}

// Custom email prompt modal (better than browser prompt)
function showEmailPrompt() {
    return new Promise((resolve) => {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'email-prompt-modal';
        modal.innerHTML = `
            <div class="email-prompt-overlay"></div>
            <div class="email-prompt-container">
                <div class="email-prompt-header">
                    <h3>Reset Password</h3>
                    <button class="email-prompt-close">&times;</button>
                </div>
                <div class="email-prompt-body">
                    <p>Enter your registered @gordoncollege.edu.ph email address to receive a password reset link.</p>
                    <input type="email" id="promptEmail" placeholder="student@gordoncollege.edu.ph" autocomplete="off">
                    <div class="email-hint" style="font-size: 11px; color: #64748b; margin-top: 8px;">
                        <span>⚠️ Only registered emails will receive a reset link</span>
                    </div>
                </div>
                <div class="email-prompt-footer">
                    <button class="email-prompt-cancel">Cancel</button>
                    <button class="email-prompt-submit">Send Reset Link</button>
                </div>
            </div>
        `;
        
        // Add styles
        if (!document.querySelector('#prompt-styles')) {
            const style = document.createElement('style');
            style.id = 'prompt-styles';
            style.textContent = `
                .email-prompt-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 20000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.2s ease;
                }
                .email-prompt-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                }
                .email-prompt-container {
                    position: relative;
                    background: white;
                    border-radius: 16px;
                    width: 90%;
                    max-width: 340px;
                    overflow: hidden;
                    animation: slideUp 0.3s ease;
                }
                .email-prompt-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 16px 12px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .email-prompt-header h3 {
                    font-size: 16px;
                    font-weight: 600;
                    color: #1e293b;
                    margin: 0;
                }
                .email-prompt-close {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #94a3b8;
                    padding: 0;
                    line-height: 1;
                }
                .email-prompt-body {
                    padding: 16px;
                }
                .email-prompt-body p {
                    font-size: 13px;
                    color: #64748b;
                    margin-bottom: 12px;
                }
                .email-prompt-body input {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 14px;
                    font-family: inherit;
                }
                .email-prompt-body input:focus {
                    outline: none;
                    border-color: #2563eb;
                }
                .email-prompt-footer {
                    display: flex;
                    gap: 12px;
                    padding: 12px 16px 16px;
                    border-top: 1px solid #f1f5f9;
                }
                .email-prompt-cancel, .email-prompt-submit {
                    flex: 1;
                    padding: 10px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .email-prompt-cancel {
                    background: #f1f5f9;
                    border: none;
                    color: #64748b;
                }
                .email-prompt-submit {
                    background: #2563eb;
                    border: none;
                    color: white;
                }
                .email-prompt-submit:hover {
                    background: #1d4ed8;
                }
                .email-hint {
                    font-size: 11px;
                    color: #64748b;
                    margin-top: 8px;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(modal);
        
        const input = modal.querySelector('#promptEmail');
        const submitBtn = modal.querySelector('.email-prompt-submit');
        const cancelBtn = modal.querySelector('.email-prompt-cancel');
        const closeBtn = modal.querySelector('.email-prompt-close');
        
        const cleanup = () => modal.remove();
        
        submitBtn.onclick = () => {
            const email = input.value.trim();
            cleanup();
            resolve(email || null);
        };
        
        cancelBtn.onclick = () => {
            cleanup();
            resolve(null);
        };
        
        closeBtn.onclick = () => {
            cleanup();
            resolve(null);
        };
        
        modal.querySelector('.email-prompt-overlay').onclick = () => {
            cleanup();
            resolve(null);
        };
        
        // Enter key support
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const email = input.value.trim();
                cleanup();
                resolve(email || null);
            }
        });
        
        input.focus();
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
    console.log('✅ Login page ready - Password reset includes email verification');
}

// Call init when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

console.log('✅ Login page script loaded. Password reset now checks if email exists in database.');