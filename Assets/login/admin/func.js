import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// List of approved email domains (any email with these domains can register)
const APPROVED_DOMAINS = [
    '@gordoncollege.edu.ph',
    '@campuscaredemo.com'
];

// Optional: List of specific additional approved emails (outside domains)
const SPECIFIC_APPROVED_EMAILS = [
    'admin@campuscaredemo.com'
];

// ========== BEAUTIFUL TOAST NOTIFICATION SYSTEM ==========
function showToast(message, isError = false, duration = 3000) {
    // Remove existing toast
    const existingToast = document.querySelector('.admin-custom-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast container
    const toast = document.createElement('div');
    toast.className = 'admin-custom-toast';
    
    // Create icon based on type
    const icon = document.createElement('div');
    icon.className = 'admin-toast-icon';
    if (isError) {
        icon.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <circle cx="12" cy="16" r="1" fill="currentColor"/>
            </svg>
        `;
    } else {
        icon.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            </svg>
        `;
    }
    
    // Create message container
    const messageContainer = document.createElement('div');
    messageContainer.className = 'admin-toast-message';
    messageContainer.textContent = message;
    
    // Create progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'admin-toast-progress';
    
    toast.appendChild(icon);
    toast.appendChild(messageContainer);
    toast.appendChild(progressBar);
    document.body.appendChild(toast);
    
    // Add styles if not already added
    if (!document.querySelector('#admin-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'admin-toast-styles';
        style.textContent = `
            .admin-custom-toast {
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
                animation: adminToastSlideUp 0.3s ease-out;
                border-left: 4px solid;
                border-left-color: ${isError ? '#EF4444' : '#10B981'};
            }
            
            .admin-custom-toast .admin-toast-icon {
                flex-shrink: 0;
                color: ${isError ? '#EF4444' : '#10B981'};
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .admin-custom-toast .admin-toast-message {
                flex: 1;
                font-size: 13px;
                font-weight: 500;
                color: #1e293b;
                line-height: 1.4;
            }
            
            .admin-custom-toast .admin-toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: ${isError ? '#EF4444' : '#10B981'};
                border-bottom-left-radius: 12px;
                animation: adminToastProgress ${duration}ms linear forwards;
            }
            
            @keyframes adminToastSlideUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes adminToastProgress {
                from {
                    width: 100%;
                }
                to {
                    width: 0%;
                }
            }
            
            @media (max-width: 480px) {
                .admin-custom-toast {
                    left: 12px;
                    right: 12px;
                    padding: 12px 14px;
                    bottom: 20px;
                }
                
                .admin-custom-toast .admin-toast-message {
                    font-size: 12px;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Auto remove after duration
    setTimeout(() => {
        toast.style.animation = 'adminToastSlideUp 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// SU TRIGGER - MOVED OUTSIDE DOMContentLoaded FOR IMMEDIATE EXECUTION
(function() {
    let suSequence = [];
    let suTimeout;
    
    document.addEventListener('keydown', function(e) {
        const key = e.key.toUpperCase();
        const activeElement = document.activeElement;
        const isTyping = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT');
        
        if (!isTyping) {
            if (key === 'S') {
                suSequence = ['S'];
                
                if (suTimeout) clearTimeout(suTimeout);
                
                suTimeout = setTimeout(function() {
                    suSequence = [];
                }, 2000);
            }
            else if (key === 'U' && suSequence[0] === 'S') {
                console.log('🎉 SU TRIGGER ACTIVATED! Showing signup form...');
                
                const loginCard = document.getElementById('adminLoginCard');
                const signupCard = document.getElementById('adminSignupCard');
                
                if (loginCard && signupCard) {
                    loginCard.style.display = 'none';
                    signupCard.style.display = 'block';
                    
                    showToast('🔐 Secret access granted! Opening registration...', false, 2000);
                    
                    const signupMsg = document.getElementById('signupMessage');
                    if (signupMsg) {
                        signupMsg.innerHTML = '🔐 <strong>Secret portal activated!</strong><br>Registration form unlocked.';
                        signupMsg.style.color = '#10b981';
                    }
                }
                
                suSequence = [];
                if (suTimeout) clearTimeout(suTimeout);
            }
        }
    });
    
    console.log('%c✅ SU TRIGGER ACTIVE! Press S then U quickly (not in input fields)', 'color: #10b981; font-size: 14px; font-weight: bold;');
})();

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded - setting up admin panel');
    
    // DOM Elements
    const adminLoginCard = document.getElementById('adminLoginCard');
    const adminSignupCard = document.getElementById('adminSignupCard');
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminSignupBtn = document.getElementById('adminSignupBtn');
    const showAdminLogin = document.getElementById('showAdminLogin');
    const showAdminForgotPassword = document.getElementById('showAdminForgotPassword');

    // Function to check if email is approved
    function isEmailApproved(email) {
        if (SPECIFIC_APPROVED_EMAILS.includes(email.toLowerCase())) {
            return true;
        }
        return APPROVED_DOMAINS.some(domain => 
            email.toLowerCase().endsWith(domain)
        );
    }

    // ============ CHECK IF ADMIN EMAIL EXISTS IN DATABASE ============
    async function checkAdminEmailExists(email) {
        try {
            const { data, error } = await supabase
                .from('admin')
                .select('email, name, role')
                .eq('email', email.toLowerCase().trim())
                .maybeSingle();
            
            if (error) {
                console.error('Error checking admin email:', error);
                return { exists: false, error: error.message };
            }
            
            return { exists: !!data, adminData: data };
        } catch (error) {
            console.error('Admin email check failed:', error);
            return { exists: false, error: error.message };
        }
    }

    // ============ CREATE ADMIN TABLE IF NOT EXISTS ============
    async function ensureAdminTableExists() {
        try {
            const { error } = await supabase
                .from('admin')
                .select('count')
                .limit(1);
            
            if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
                console.log('Admin table does not exist. Please create it in Supabase SQL editor.');
                return false;
            }
            return true;
        } catch (err) {
            console.error('Error checking admin table:', err);
            return false;
        }
    }

    // ============ METHOD 2: MOBILE - Triple tap on logo ============
    let logoTapCount = 0;
    let logoTapTimeout;
    
    const logoElement = document.querySelector('.app-icon img');
    if (logoElement) {
        logoElement.addEventListener('click', (e) => {
            e.stopPropagation();
            logoTapCount++;
            clearTimeout(logoTapTimeout);
            logoTapTimeout = setTimeout(() => { logoTapCount = 0; }, 800);
            
            if (logoTapCount === 3) {
                console.log('✅ Mobile trigger: Logo triple-tap');
                if (adminLoginCard && adminSignupCard) {
                    adminLoginCard.style.display = 'none';
                    adminSignupCard.style.display = 'block';
                    const signupMessage = document.getElementById('signupMessage');
                    if (signupMessage) {
                        signupMessage.innerHTML = '🔐 <strong>Secret portal activated!</strong><br>Registration form unlocked.';
                        signupMessage.style.color = '#10b981';
                    }
                    showToast('📝 Secret access granted! Opening registration...', false, 2000);
                }
                logoTapCount = 0;
            }
        });
    }

    // ============ METHOD 3: MOBILE - Long press on footer ============
    let pressTimer;
    const footerElement = document.querySelector('footer');
    
    if (footerElement) {
        footerElement.addEventListener('touchstart', (e) => {
            pressTimer = setTimeout(() => {
                console.log('✅ Mobile trigger: Long press on footer');
                if (adminLoginCard && adminSignupCard) {
                    adminLoginCard.style.display = 'none';
                    adminSignupCard.style.display = 'block';
                    const signupMessage = document.getElementById('signupMessage');
                    if (signupMessage) {
                        signupMessage.innerHTML = '🔐 <strong>Secret portal activated!</strong><br>Registration form unlocked.';
                        signupMessage.style.color = '#10b981';
                    }
                    showToast('📝 Secret access granted! Opening registration...', false, 2000);
                }
            }, 3000);
        });
        
        footerElement.addEventListener('touchend', () => {
            clearTimeout(pressTimer);
        });
        
        footerElement.addEventListener('touchmove', () => {
            clearTimeout(pressTimer);
        });
        
        footerElement.addEventListener('mousedown', (e) => {
            pressTimer = setTimeout(() => {
                console.log('✅ Desktop trigger: Long press on footer');
                if (adminLoginCard && adminSignupCard) {
                    adminLoginCard.style.display = 'none';
                    adminSignupCard.style.display = 'block';
                    const signupMessage = document.getElementById('signupMessage');
                    if (signupMessage) {
                        signupMessage.innerHTML = '🔐 <strong>Secret portal activated!</strong><br>Registration form unlocked.';
                        signupMessage.style.color = '#10b981';
                    }
                    showToast('📝 Secret access granted! Opening registration...', false, 2000);
                }
            }, 3000);
        });
        
        footerElement.addEventListener('mouseup', () => {
            clearTimeout(pressTimer);
        });
    }

    // METHOD 4: MOBILE - Two-finger tap on header 
    let twoFingerTap = false;
    const headerElement = document.querySelector('.header');
    
    if (headerElement) {
        headerElement.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                twoFingerTap = true;
            }
        });
        
        headerElement.addEventListener('touchend', (e) => {
            if (twoFingerTap) {
                console.log('✅ Mobile trigger: Two-finger tap');
                if (adminLoginCard && adminSignupCard) {
                    adminLoginCard.style.display = 'none';
                    adminSignupCard.style.display = 'block';
                    const signupMessage = document.getElementById('signupMessage');
                    if (signupMessage) {
                        signupMessage.innerHTML = '🔐 <strong>Secret portal activated!</strong><br>Registration form unlocked.';
                        signupMessage.style.color = '#10b981';
                    }
                    showToast('📝 Secret access granted! Opening registration...', false, 2000);
                }
                twoFingerTap = false;
            }
        });
    }

    console.log('%c📱 MOBILE: Triple-tap logo | Long press footer (3s) | Two-finger tap header', 'color: #10b981; font-size: 12px;');
    console.log('%c📧 Approved domains: ' + APPROVED_DOMAINS.join(', '), 'color: #10b981; font-size: 12px;');

    // Toggle between login and signup (back to login)
    if (showAdminLogin) {
        showAdminLogin.addEventListener('click', () => {
            if (adminSignupCard && adminLoginCard) {
                adminSignupCard.style.display = 'none';
                adminLoginCard.style.display = 'block';
                const loginMessage = document.getElementById('loginMessage');
                if (loginMessage) {
                    loginMessage.textContent = 'Access admin panel securely';
                    loginMessage.style.color = '#64748b';
                }
            }
        });
    }

    // Password visibility toggle
    function setupPasswordToggle(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        const container = input.closest('.password-container');
        if (!container) return;
        
        if (!container.querySelector('.toggle-password')) {
            const toggleEye = document.createElement('i');
            toggleEye.className = 'fas fa-eye toggle-password';
            toggleEye.style.position = 'absolute';
            toggleEye.style.right = '16px';
            toggleEye.style.cursor = 'pointer';
            toggleEye.style.color = '#10b981';
            toggleEye.style.zIndex = '10';
            container.appendChild(toggleEye);
            
            toggleEye.addEventListener('click', function() {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                this.classList.toggle('fa-eye-slash');
            });
        }
    }

    setupPasswordToggle('adminPasswordInput');
    setupPasswordToggle('adminSignupPassword');
    setupPasswordToggle('adminConfirmPassword');

    // ============ ADMIN LOGIN FUNCTION ============
    async function adminLogin() {
        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPasswordInput').value;
        const messageEl = document.getElementById('loginMessage');
        
        if (!email || !password) {
            showToast('Please fill in all fields', true);
            messageEl.textContent = 'Please fill in all fields';
            messageEl.style.color = '#DC2626';
            return;
        }
        
        try {
            adminLoginBtn.disabled = true;
            adminLoginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
            
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (authError) {
                if (authError.message.includes('Invalid login credentials')) {
                    throw new Error('Invalid email or password');
                }
                throw authError;
            }
            
            if (!authData.user.email_confirmed_at) {
                const { error: resendError } = await supabase.auth.resend({
                    type: 'signup',
                    email: email
                });
                
                if (!resendError) {
                    throw new Error('Please check your email and confirm your account. A new confirmation link has been sent.');
                } else {
                    throw new Error('Please confirm your email address before logging in. Check your spam folder.');
                }
            }
            
            // Check if admin exists in admin table
            let adminData = null;
            let adminError = null;
            
            try {
                const result = await supabase
                    .from('admin')
                    .select('*')
                    .eq('email', email)
                    .single();
                adminData = result.data;
                adminError = result.error;
            } catch (err) {
                console.error('Error checking admin table:', err);
                adminError = err;
            }
            
            // If admin doesn't exist in table, create them
            if (adminError || !adminData) {
                if (isEmailApproved(email)) {
                    try {
                        const { data: newAdmin, error: insertError } = await supabase
                            .from('admin')
                            .insert([{
                                email: email,
                                name: authData.user.user_metadata?.name || email.split('@')[0],
                                role: 'admin',
                                is_active: true
                            }])
                            .select()
                            .single();
                        
                        if (insertError) {
                            console.error('Insert error details:', insertError);
                            
                            if (insertError.code === '42P01') {
                                throw new Error('Admin table does not exist. Please run the database setup SQL in Supabase.');
                            } else if (insertError.message.includes('row-level security')) {
                                throw new Error('Database permission issue. Please disable RLS on admin table temporarily.');
                            } else {
                                throw new Error('Could not create admin profile: ' + insertError.message);
                            }
                        }
                        adminData = newAdmin;
                        console.log('Admin profile created successfully:', adminData);
                    } catch (insertError) {
                        console.error('Insert failed:', insertError);
                        throw insertError;
                    }
                } else {
                    throw new Error('Your email is not authorized for admin access.');
                }
            } else if (!adminData.is_active) {
                throw new Error('Your account is pending approval. Please contact system administrator.');
            }
            
            const adminSession = {
                id: authData.user.id,
                name: adminData?.name || authData.user.user_metadata?.name || 'Administrator',
                email: email,
                role: adminData?.role || 'admin',
                loggedInAt: new Date().toISOString()
            };
            
            localStorage.setItem('currentAdmin', JSON.stringify(adminSession));
            localStorage.setItem('isAdminLoggedIn', 'true');
            
            showToast('Login successful! Redirecting...', false, 1000);
            
            setTimeout(() => {
                window.location.href = '/Assets/Admin_dashboard/Admin.html';
            }, 1000);
            
        } catch (error) {
            console.error('Login error:', error);
            showToast(error.message, true);
            messageEl.textContent = error.message;
            messageEl.style.color = '#DC2626';
            
            if (adminLoginCard) {
                adminLoginCard.classList.add('shake');
                setTimeout(() => adminLoginCard.classList.remove('shake'), 400);
            }
            
            adminLoginBtn.disabled = false;
            adminLoginBtn.innerHTML = 'Login';
        }
    }

    // ============ ADMIN SIGNUP FUNCTION ============
    async function adminSignup() {
        const name = document.getElementById('adminName').value.trim();
        const email = document.getElementById('adminSignupEmail').value.trim();
        const password = document.getElementById('adminSignupPassword').value;
        const confirmPassword = document.getElementById('adminConfirmPassword').value;
        const messageEl = document.getElementById('signupMessage');
        
        if (!name || !email || !password || !confirmPassword) {
            showToast('Please fill in all fields', true);
            messageEl.textContent = 'Please fill in all fields';
            messageEl.style.color = '#DC2626';
            return;
        }
        
        if (password.length < 6) {
            showToast('Password must be at least 6 characters', true);
            messageEl.textContent = 'Password must be at least 6 characters';
            messageEl.style.color = '#DC2626';
            return;
        }
        
        if (password !== confirmPassword) {
            showToast('Passwords do not match', true);
            messageEl.textContent = 'Passwords do not match';
            messageEl.style.color = '#DC2626';
            return;
        }
        
        if (!isEmailApproved(email)) {
            showToast(`Only ${APPROVED_DOMAINS.join(', ')} email addresses are authorized for admin access.`, true);
            messageEl.textContent = `Only ${APPROVED_DOMAINS.join(', ')} email addresses are authorized for admin access.`;
            messageEl.style.color = '#DC2626';
            return;
        }
        
        try {
            adminSignupBtn.disabled = true;
            adminSignupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            
            const { data: existingUser } = await supabase.auth.signInWithPassword({
                email: email,
                password: 'dummy-check'
            }).catch(() => ({ data: null }));
            
            if (existingUser?.user) {
                throw new Error('An account with this email already exists. Please login.');
            }
            
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        name: name,
                        role: 'admin'
                    },
                    emailRedirectTo: window.location.origin + '/Assets/login/admin/admin.html'
                }
            });
            
            if (signUpError) {
                throw signUpError;
            }
            
            if (authData.user) {
                const { data: existingAdmin } = await supabase
                    .from('admin')
                    .select('id')
                    .eq('email', email)
                    .single();
                
                if (!existingAdmin) {
                    const { error: insertError } = await supabase
                        .from('admin')
                        .insert([{
                            email: email,
                            name: name,
                            role: 'admin',
                            is_active: false
                        }]);
                    
                    if (insertError) {
                        console.error('Insert error:', insertError);
                    }
                }
                
                showToast('Registration successful! Please check your email to confirm your account.', false, 5000);
                messageEl.innerHTML = '✓ <strong>Registration successful!</strong><br><br>A confirmation link has been sent to your email address.<br><br>Please check your inbox and click the link to confirm your account.<br><br>After confirmation, you will be able to login.';
                messageEl.style.color = '#10b981';
                
                adminSignupBtn.innerHTML = '<i class="fas fa-check"></i> Email Sent!';
                
                document.getElementById('adminName').value = '';
                document.getElementById('adminSignupEmail').value = '';
                document.getElementById('adminSignupPassword').value = '';
                document.getElementById('adminConfirmPassword').value = '';
                
                setTimeout(() => {
                    adminSignupCard.style.display = 'none';
                    adminLoginCard.style.display = 'block';
                    document.getElementById('loginMessage').innerHTML = 'Please check your email and confirm before logging in.<br>Check spam folder if you dont see it.';
                    document.getElementById('loginMessage').style.color = '#10b981';
                }, 5000);
            }
            
        } catch (error) {
            console.error('Signup error:', error);
            showToast(error.message, true);
            messageEl.innerHTML = '❌ ' + error.message;
            messageEl.style.color = '#DC2626';
            
            adminSignupBtn.disabled = false;
            adminSignupBtn.innerHTML = 'Request Access';
        }
    }

    // ============ CUSTOM EMAIL PROMPT MODAL ============
    function showAdminEmailPrompt() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'admin-email-prompt-modal';
            modal.innerHTML = `
                <div class="admin-email-prompt-overlay"></div>
                <div class="admin-email-prompt-container">
                    <div class="admin-email-prompt-header">
                        <h3>Admin Password Reset</h3>
                        <button class="admin-email-prompt-close">&times;</button>
                    </div>
                    <div class="admin-email-prompt-body">
                        <p>Enter your registered admin email address to receive a password reset link.</p>
                        <input type="email" id="adminPromptEmail" placeholder="admin@gordoncollege.edu.ph" autocomplete="off">
                        <div class="admin-email-hint">
                            <span>⚠️ Only registered admin emails will receive a reset link</span>
                        </div>
                    </div>
                    <div class="admin-email-prompt-footer">
                        <button class="admin-email-prompt-cancel">Cancel</button>
                        <button class="admin-email-prompt-submit">Send Reset Link</button>
                    </div>
                </div>
            `;
            
            // Add styles for modal
            if (!document.querySelector('#admin-prompt-styles')) {
                const style = document.createElement('style');
                style.id = 'admin-prompt-styles';
                style.textContent = `
                    .admin-email-prompt-modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        z-index: 20000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        animation: adminFadeIn 0.2s ease;
                    }
                    .admin-email-prompt-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.5);
                    }
                    .admin-email-prompt-container {
                        position: relative;
                        background: white;
                        border-radius: 16px;
                        width: 90%;
                        max-width: 340px;
                        overflow: hidden;
                        animation: adminSlideUp 0.3s ease;
                    }
                    .admin-email-prompt-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 16px 16px 12px;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    .admin-email-prompt-header h3 {
                        font-size: 16px;
                        font-weight: 600;
                        color: #1e293b;
                        margin: 0;
                    }
                    .admin-email-prompt-close {
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #94a3b8;
                        padding: 0;
                        line-height: 1;
                    }
                    .admin-email-prompt-body {
                        padding: 16px;
                    }
                    .admin-email-prompt-body p {
                        font-size: 13px;
                        color: #64748b;
                        margin-bottom: 12px;
                    }
                    .admin-email-prompt-body input {
                        width: 100%;
                        padding: 10px 12px;
                        border: 1.5px solid #e2e8f0;
                        border-radius: 8px;
                        font-size: 14px;
                        font-family: inherit;
                    }
                    .admin-email-prompt-body input:focus {
                        outline: none;
                        border-color: #10b981;
                    }
                    .admin-email-prompt-footer {
                        display: flex;
                        gap: 12px;
                        padding: 12px 16px 16px;
                        border-top: 1px solid #f1f5f9;
                    }
                    .admin-email-prompt-cancel, .admin-email-prompt-submit {
                        flex: 1;
                        padding: 10px;
                        border-radius: 8px;
                        font-size: 13px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .admin-email-prompt-cancel {
                        background: #f1f5f9;
                        border: none;
                        color: #64748b;
                    }
                    .admin-email-prompt-submit {
                        background: #10b981;
                        border: none;
                        color: white;
                    }
                    .admin-email-prompt-submit:hover {
                        background: #059669;
                    }
                    .admin-email-hint {
                        font-size: 11px;
                        color: #64748b;
                        margin-top: 8px;
                    }
                    @keyframes adminFadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes adminSlideUp {
                        from { transform: translateY(20px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `;
                document.head.appendChild(style);
            }
            
            document.body.appendChild(modal);
            
            const input = modal.querySelector('#adminPromptEmail');
            const submitBtn = modal.querySelector('.admin-email-prompt-submit');
            const cancelBtn = modal.querySelector('.admin-email-prompt-cancel');
            const closeBtn = modal.querySelector('.admin-email-prompt-close');
            
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
            
            modal.querySelector('.admin-email-prompt-overlay').onclick = () => {
                cleanup();
                resolve(null);
            };
            
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

    // ============ FORGOT PASSWORD FUNCTION (UPDATED WITH EMAIL CHECK) ============
    async function forgotPassword() {
        const email = await showAdminEmailPrompt();
        
        if (email && email.trim()) {
            const trimmedEmail = email.trim().toLowerCase();
            
            showToast('Verifying email address...', false, 2000);
            
            try {
                // CHECK IF ADMIN EMAIL EXISTS IN DATABASE FIRST
                const { exists, adminData, error: checkError } = await checkAdminEmailExists(trimmedEmail);
                
                if (checkError) {
                    throw new Error('Unable to verify email. Please try again.');
                }
                
                if (!exists) {
                    showToast('❌ Admin email not found. Please contact super administrator.', true, 4000);
                    return;
                }
                
                // Email exists, send reset link
                console.log(`✅ Admin email verified: ${trimmedEmail} belongs to ${adminData?.name}`);
                
                const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
                    redirectTo: `${window.location.origin}/Assets/Admin/reset-password.html?type=admin`
                });
                
                if (error) throw error;
                
                showToast(`✅ Password reset email sent to ${trimmedEmail}! Check your inbox.`, false, 5000);
                
            } catch (error) {
                console.error('Password reset error:', error);
                showToast(error.message || 'Failed to send reset email. Please try again.', true);
            }
        }
    }

    // Attach event listeners
    if (adminLoginBtn) adminLoginBtn.addEventListener('click', adminLogin);
    if (adminSignupBtn) adminSignupBtn.addEventListener('click', adminSignup);
    if (showAdminForgotPassword) showAdminForgotPassword.addEventListener('click', forgotPassword);

    // Allow Enter key to submit
    const adminEmail = document.getElementById('adminEmail');
    const adminPassword = document.getElementById('adminPasswordInput');
    if (adminEmail && adminPassword) {
        adminPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') adminLogin();
        });
        adminEmail.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') adminLogin();
        });
    }

    // SECRET PASSCODES FOR ADMIN REGISTRATION
    const SECRET_PASSCODES = [
        'SU', 'ADMIN', 'CAMPUS', '7890', '#123#'
    ];

    (function() {
        let keySequence = [];
        let sequenceTimeout;
        
        function checkSecret(input) {
            const upperInput = input.toUpperCase();
            for (let secret of SECRET_PASSCODES) {
                if (upperInput === secret || upperInput === secret.toUpperCase()) {
                    return true;
                }
            }
            return false;
        }
        
        document.addEventListener('keydown', function(e) {
            const key = e.key.toUpperCase();
            const activeElement = document.activeElement;
            const isTyping = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT');
            
            if (!isTyping) {
                if (key === 'S') {
                    keySequence = ['S'];
                    if (sequenceTimeout) clearTimeout(sequenceTimeout);
                    sequenceTimeout = setTimeout(() => { keySequence = []; }, 2000);
                }
                else if (key === 'U' && keySequence[0] === 'S') {
                    console.log('🎉 SU TRIGGER ACTIVATED!');
                    showRegistration();
                    keySequence = [];
                    if (sequenceTimeout) clearTimeout(sequenceTimeout);
                }
                else {
                    if (keySequence.length === 0 && key !== 'S') {
                        keySequence = [key];
                    } else if (keySequence.length > 0) {
                        keySequence.push(key);
                    }
                    
                    if (sequenceTimeout) clearTimeout(sequenceTimeout);
                    sequenceTimeout = setTimeout(() => { keySequence = []; }, 2000);
                    
                    const currentSequence = keySequence.join('');
                    if (checkSecret(currentSequence)) {
                        console.log(`🎉 Secret "${currentSequence}" TRIGGER ACTIVATED!`);
                        showRegistration();
                        keySequence = [];
                        if (sequenceTimeout) clearTimeout(sequenceTimeout);
                    }
                }
            }
        });
        
        function showRegistration() {
            const loginCard = document.getElementById('adminLoginCard');
            const signupCard = document.getElementById('adminSignupCard');
            
            if (loginCard && signupCard) {
                loginCard.style.display = 'none';
                signupCard.style.display = 'block';
                showToast('🔐 Secret access granted! Opening registration...', false, 2000);
                
                const signupMsg = document.getElementById('signupMessage');
                if (signupMsg) {
                    signupMsg.innerHTML = '🔐 <strong>Secret portal activated!</strong><br>Registration form unlocked.';
                    signupMsg.style.color = '#10b981';
                }
            }
        }
        
        console.log('%c✅ SECRET PASSCODES ACTIVE! Try typing: SU, ADMIN, CAMPUS, 7890, #123#', 'color: #10b981; font-size: 14px; font-weight: bold;');
    })();

    // Check if already logged in
    const alreadyLoggedIn = localStorage.getItem('isAdminLoggedIn');
    if (alreadyLoggedIn === 'true' && window.location.pathname.includes('admin.html')) {
        const confirmRedirect = confirm('You are already logged in. Go to dashboard?');
        if (confirmRedirect) {
            window.location.href = '/Assets/Admin_dashboard/Admin.html';
        }
    }
});

console.log('Admin script loaded - waiting for DOM');