import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://opjyksksnccurdwyskiu.supabase.co'
const supabaseKey = 'sb_publishable_l7mKNQVJ6WesiTM4GJCxQg_oXxTN3it'
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

// SU TRIGGER - MOVED OUTSIDE DOMContentLoaded FOR IMMEDIATE EXECUTION
(function() {
    let suSequence = [];
    let suTimeout;
    
    document.addEventListener('keydown', function(e) {
        const key = e.key.toUpperCase();
        
        // Check if NOT typing in an input field
        const activeElement = document.activeElement;
        const isTyping = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT');
        
        console.log('🔑 Key pressed:', key, '| Is typing:', isTyping);
        
        if (!isTyping) {
            if (key === 'S') {
                suSequence = ['S'];
                console.log('✅ S pressed - waiting for U...');
                
                if (suTimeout) clearTimeout(suTimeout);
                
                suTimeout = setTimeout(function() {
                    suSequence = [];
                    console.log('⏰ Sequence reset after timeout');
                }, 2000);
            }
            else if (key === 'U' && suSequence[0] === 'S') {
                console.log('🎉 SU TRIGGER ACTIVATED! Showing signup form...');
                
                // Show signup form
                const loginCard = document.getElementById('adminLoginCard');
                const signupCard = document.getElementById('adminSignupCard');
                
                if (loginCard && signupCard) {
                    loginCard.style.display = 'none';
                    signupCard.style.display = 'block';
                    
                    // Show toast message
                    const toast = document.createElement('div');
                    toast.textContent = '🔐 Secret access granted! Opening registration...';
                    toast.style.position = 'fixed';
                    toast.style.bottom = '100px';
                    toast.style.right = '20px';
                    toast.style.background = '#1e293b';
                    toast.style.color = '#10b981';
                    toast.style.padding = '12px 20px';
                    toast.style.borderRadius = '12px';
                    toast.style.fontSize = '14px';
                    toast.style.fontFamily = 'monospace';
                    toast.style.zIndex = '9999';
                    toast.style.opacity = '1';
                    toast.style.transition = 'opacity 0.3s';
                    document.body.appendChild(toast);
                    
                    setTimeout(function() {
                        toast.style.opacity = '0';
                        setTimeout(function() {
                            toast.remove();
                        }, 300);
                    }, 2000);
                    
                    // Update signup message
                    const signupMsg = document.getElementById('signupMessage');
                    if (signupMsg) {
                        signupMsg.innerHTML = '🔐 <strong>Secret portal activated!</strong><br>Registration form unlocked.';
                        signupMsg.style.color = '#10b981';
                    }
                }
                
                // Reset sequence
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

    // Toast notification function
    function showToast(message, isSuccess = true) {
        let toast = document.getElementById('adminToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'adminToast';
            toast.className = 'admin-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.color = isSuccess ? '#10b981' : '#ef4444';
        toast.style.opacity = '1';
        setTimeout(() => {
            toast.style.opacity = '0';
        }, 2000);
    }

    // Function to check if email is approved
    function isEmailApproved(email) {
        // Check specific emails first
        if (SPECIFIC_APPROVED_EMAILS.includes(email.toLowerCase())) {
            return true;
        }
        // Check if email domain is approved
        return APPROVED_DOMAINS.some(domain => 
            email.toLowerCase().endsWith(domain)
        );
    }

    // ============ CREATE ADMIN TABLE IF NOT EXISTS ============
    async function ensureAdminTableExists() {
        try {
            // Check if admin table exists by trying to select from it
            const { error } = await supabase
                .from('admin')
                .select('count')
                .limit(1);
            
            if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
                console.log('Admin table does not exist. Please create it in Supabase SQL editor.');
                console.log('Run this SQL: CREATE TABLE admin (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email VARCHAR(255) UNIQUE NOT NULL, name VARCHAR(255) NOT NULL, role VARCHAR(50) DEFAULT admin, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())');
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
                    showToast('📝 Secret access granted! Opening registration...', true);
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
                    showToast('📝 Secret access granted! Opening registration...', true);
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
                    showToast('📝 Secret access granted! Opening registration...', true);
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
                    showToast('📝 Secret access granted! Opening registration...', true);
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

    // ============ ADMIN LOGIN FUNCTION (FIXED) ============
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
                // Only auto-create if email is approved
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
                            
                            // Check for specific errors
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
            
            messageEl.textContent = 'Login successful! Redirecting...';
            adminLoginBtn.style.backgroundColor = '#059669';
            adminLoginBtn.innerHTML = '<i class="fas fa-check"></i> Success!';
            
            setTimeout(() => {
                window.location.href = '/Assets/Admin_dashboard/Admin.html';
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

    // ADMIN SIGNUP - Allows multiple accounts 
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
        
        // Check if email is approved (domain or specific list)
        if (!isEmailApproved(email)) {
            messageEl.textContent = `Only ${APPROVED_DOMAINS.join(', ')} email addresses are authorized for admin access.`;
            messageEl.style.color = '#DC2626';
            return;
        }
        
        try {
            adminSignupBtn.disabled = true;
            adminSignupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            messageEl.textContent = 'Creating your account...';
            messageEl.style.color = '#10b981';
            
            // Check if user already exists in Supabase Auth
            const { data: existingUser } = await supabase.auth.signInWithPassword({
                email: email,
                password: 'dummy-check'
            }).catch(() => ({ data: null }));
            
            if (existingUser?.user) {
                throw new Error('An account with this email already exists. Please login.');
            }
            
            // Sign up with Supabase Auth
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
                // Check if admin already exists in admin table
                const { data: existingAdmin } = await supabase
                    .from('admin')
                    .select('id')
                    .eq('email', email)
                    .single();
                
                if (!existingAdmin) {
                    // Add to admin table (pending email confirmation)
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
                
                messageEl.innerHTML = '✓ <strong>Registration successful!</strong><br><br>A confirmation link has been sent to your email address.<br><br>Please check your inbox and click the link to confirm your account.<br><br>After confirmation, you will be able to login.';
                messageEl.style.color = '#10b981';
                
                adminSignupBtn.style.backgroundColor = '#059669';
                adminSignupBtn.innerHTML = '<i class="fas fa-check"></i> Email Sent!';
                
                // Clear form
                document.getElementById('adminName').value = '';
                document.getElementById('adminSignupEmail').value = '';
                document.getElementById('adminSignupPassword').value = '';
                document.getElementById('adminConfirmPassword').value = '';
                
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

    //  FORGOT PASSWORD 
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
            window.location.href = '/Assets/Admin_dashboard/Admin.html';
        }
    }
});

console.log('Admin script loaded - waiting for DOM');