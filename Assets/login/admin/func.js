import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://opjyksksnccurdwyskiu.supabase.co'
const supabaseKey = 'sb_publishable_l7mKNQVJ6WesiTM4GJCxQg_oXxTN3it'
const supabase = createClient(supabaseUrl, supabaseKey)

// List of pre-approved admin emails (only these can become admin)
const APPROVED_ADMIN_EMAILS = [
    '202410312@gordoncollege.edu.ph',
    'admin@campuscaredemo.com'
];

await supabase.auth.signInWithOtp({
    email: '202410312@gordoncollege.edu.ph'
});

// DOM Elements
const adminLoginCard = document.getElementById('adminLoginCard');
const adminSignupCard = document.getElementById('adminSignupCard');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminSignupBtn = document.getElementById('adminSignupBtn');
const showAdminLogin = document.getElementById('showAdminLogin');
const showAdminForgotPassword = document.getElementById('showAdminForgotPassword');

// Toggle between login and signup
if (showAdminLogin) {
    showAdminLogin.addEventListener('click', () => {
        adminSignupCard.style.display = 'none';
        adminLoginCard.style.display = 'block';
        document.getElementById('loginMessage').textContent = 'Access admin panel securely';
    });
}

// Password visibility toggle
function setupPasswordToggle(inputId) {
    const container = document.querySelector(`#${inputId}`)?.closest('.password-container');
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
        
        const passwordInput = document.getElementById(inputId);
        toggleEye.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
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
        messageEl.textContent = 'Please fill in all fields';
        messageEl.style.color = '#DC2626';
        return;
    }
    
    try {
        adminLoginBtn.disabled = true;
        adminLoginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
        messageEl.textContent = 'Checking credentials...';
        messageEl.style.color = '#10b981';
        
        // First, try to sign in with Supabase Auth
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
        
        // Check if email is confirmed
        if (!authData.user.email_confirmed_at) {
            // Resend confirmation email
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
        
        // Check if admin exists in your admin table and is active
        const { data: adminData, error: adminError } = await supabase
            .from('admin')
            .select('*')
            .eq('email', email)
            .single();
        
        if (adminError || !adminData) {
            // If not in admin table, add them as active admin
            const { error: insertError } = await supabase
                .from('admin')
                .insert([{
                    email: email,
                    name: authData.user.user_metadata?.name || 'Administrator',
                    role: 'admin',
                    is_active: true
                }]);
            
            if (insertError) {
                throw new Error('Admin account not properly configured. Please contact support.');
            }
        } else if (!adminData.is_active) {
            throw new Error('Your account is pending approval. Please contact system administrator.');
        }
        
        // Store admin session
        const adminSession = {
            id: authData.user.id,
            name: adminData?.name || authData.user.user_metadata?.name || 'Administrator',
            email: email,
            role: 'admin',
            loggedInAt: new Date().toISOString()
        };
        
        localStorage.setItem('currentAdmin', JSON.stringify(adminSession));
        localStorage.setItem('isAdminLoggedIn', 'true');
        
        messageEl.textContent = 'Login successful! Redirecting...';
        adminLoginBtn.style.backgroundColor = '#059669';
        adminLoginBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
        
        setTimeout(() => {
            window.location.href = '/Assets/Admin dashboard/index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        messageEl.textContent = error.message;
        messageEl.style.color = '#DC2626';
        
        if (adminLoginCard) {
            adminLoginCard.classList.add('shake');
            setTimeout(() => adminLoginCard.classList.remove('shake'), 400);
        }
        
        adminLoginBtn.disabled = false;
        adminLoginBtn.innerHTML = 'Login';
        adminLoginBtn.style.backgroundColor = '#10b981';
    }
}

// ============ ADMIN SIGNUP WITH EMAIL CONFIRMATION ============
async function adminSignup() {
    const name = document.getElementById('adminName').value.trim();
    const email = document.getElementById('adminSignupEmail').value.trim();
    const password = document.getElementById('adminSignupPassword').value;
    const confirmPassword = document.getElementById('adminConfirmPassword').value;
    const messageEl = document.getElementById('signupMessage');
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
        messageEl.textContent = 'Please fill in all fields';
        messageEl.style.color = '#DC2626';
        return;
    }
    
    if (password.length < 6) {
        messageEl.textContent = 'Password must be at least 6 characters';
        messageEl.style.color = '#DC2626';
        return;
    }
    
    if (password !== confirmPassword) {
        messageEl.textContent = 'Passwords do not match';
        messageEl.style.color = '#DC2626';
        return;
    }
    
    // Check if email is in approved list
    if (!APPROVED_ADMIN_EMAILS.includes(email.toLowerCase())) {
        messageEl.textContent = 'This email is not authorized for admin access. Please contact system administrator.';
        messageEl.style.color = '#DC2626';
        return;
    }
    
    try {
        adminSignupBtn.disabled = true;
        adminSignupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        messageEl.textContent = 'Creating your account...';
        messageEl.style.color = '#10b981';
        
        // Check if user already exists in Auth
        const { data: existingUser } = await supabase.auth.signInWithPassword({
            email: email,
            password: 'dummy-check'
        }).catch(() => ({ data: null }));
        
        // Sign up with Supabase Auth (THIS SENDS THE CONFIRMATION EMAIL)
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
            if (signUpError.message.includes('already registered')) {
                throw new Error('An account with this email already exists. Please login.');
            }
            throw signUpError;
        }
        
        if (authData.user) {
            // Check if admin already exists in admin table
            const { data: existingAdmin } = await supabase
                .from('admin')
                .select('id')
                .eq('email', email)
                .single();
            
            if (!existingAdmin) {
                // Add to admin table (pending approval until email confirmed)
                const { error: insertError } = await supabase
                    .from('admin')
                    .insert([{
                        email: email,
                        name: name,
                        role: 'admin',
                        is_active: false  // Will be activated after email confirmation
                    }]);
                
                if (insertError) console.error('Insert error:', insertError);
            }
            
            messageEl.innerHTML = '✓ <strong>Registration successful!</strong><br><br>A confirmation link has been sent to your email address.<br><br>Please check your inbox and click the link to confirm your account.<br><br>After confirmation, you will be able to login.';
            messageEl.style.color = '#10b981';
            
            adminSignupBtn.style.backgroundColor = '#059669';
            adminSignupBtn.innerHTML = '<i class="fas fa-check"></i> Email Sent!';
            
            // Show login form after 5 seconds
            setTimeout(() => {
                adminSignupCard.style.display = 'none';
                adminLoginCard.style.display = 'block';
                document.getElementById('loginMessage').innerHTML = 'Please check your email and confirm before logging in.<br>Check spam folder if you dont see it.';
                document.getElementById('loginMessage').style.color = '#10b981';
            }, 5000);
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        messageEl.innerHTML = '❌ ' + error.message;
        messageEl.style.color = '#DC2626';
        
        adminSignupBtn.disabled = false;
        adminSignupBtn.innerHTML = 'Request Access';
        adminSignupBtn.style.backgroundColor = '#10b981';
    }
}

// ============ RESEND CONFIRMATION EMAIL ============
async function resendConfirmation() {
    const email = prompt('Enter your email address to resend confirmation link:');
    if (!email) return;
    
    try {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email
        });
        
        if (error) throw error;
        
        alert('Confirmation link has been resent to your email. Please check your inbox.');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// ============ FORGOT PASSWORD ============
async function forgotPassword() {
    const email = prompt('Please enter your admin email address:');
    if (!email) return;
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/Assets/login/admin/reset-password.html'
        });
        
        if (error) throw error;
        
        alert('Password reset link has been sent to your email. Please check your inbox.');
    } catch (error) {
        alert('Error: ' + error.message);
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

// Check if already logged in
const alreadyLoggedIn = localStorage.getItem('isAdminLoggedIn');
if (alreadyLoggedIn === 'true' && window.location.pathname.includes('admin.html')) {
    const confirmRedirect = confirm('You are already logged in. Go to dashboard?');
    if (confirmRedirect) {
        window.location.href = '/Assets/Admin dashboard/index.html';
    }
}

// Helper function to check email confirmation status
window.checkEmailConfirmation = async function(email) {
    const { data, error } = await supabase.auth.admin.getUserByEmail(email);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('User confirmed:', data?.user?.email_confirmed_at);
    }
};

console.log('Approved admin emails:', APPROVED_ADMIN_EMAILS);
console.log('To resend confirmation email, call: resendConfirmation()');