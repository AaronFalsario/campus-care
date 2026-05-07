import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

window.togglePassword = function(inputId, element) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        element.textContent = '🙈';
    } else {
        input.type = 'password';
        element.textContent = '👁️';
    }
}

window.updatePassword = async function() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const resetBtn = document.getElementById('resetBtn');
    const messageDiv = document.getElementById('message');

    // Clear previous message
    messageDiv.className = 'message';
    messageDiv.style.display = 'none';

    // Validation
    if (!newPassword || !confirmPassword) {
        messageDiv.textContent = 'Please fill in both fields';
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
        return;
    }

    if (newPassword.length < 6) {
        messageDiv.textContent = 'Password must be at least 6 characters';
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
        return;
    }

    if (newPassword !== confirmPassword) {
        messageDiv.textContent = 'Passwords do not match';
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
        return;
    }

    // Disable button and show loading
    resetBtn.disabled = true;
    resetBtn.innerHTML = '<span class="loader"></span> Updating...';

    try {
        // CRITICAL FIX: Check URL hash for recovery token and set session
        if (window.location.hash && window.location.hash.includes('access_token')) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            const type = hashParams.get('type');
            
            console.log('Recovery type:', type);
            console.log('Access token found:', !!accessToken);
            
            if (accessToken && type === 'recovery') {
                // Set the session with the recovery tokens
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                });
                
                if (sessionError) {
                    console.error('Session error:', sessionError);
                    throw new Error('Invalid or expired reset link. Please request a new one.');
                }
            } else {
                throw new Error('Invalid reset link. Please request a new password reset.');
            }
        } else {
            // Check if we have an existing session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('No valid reset session found. Please use the link from your email.');
            }
        }
        
        // Update the user's password
        const { error } = await supabase.auth.updateUser({ 
            password: newPassword 
        });

        if (error) throw error;

        messageDiv.textContent = '✅ Password updated successfully! Redirecting to login...';
        messageDiv.className = 'message success';
        messageDiv.style.display = 'block';

        // Clear any stored admin session
        localStorage.removeItem('currentAdmin');
        localStorage.removeItem('isAdminLoggedIn');

        // Redirect to login page after 2 seconds
        setTimeout(() => {
            window.location.href = '/Assets/login/admin/admin.html';
        }, 2000);

    } catch (error) {
        console.error('Password update error:', error);
        messageDiv.textContent = error.message || 'Failed to update password. Please try again or request a new reset link.';
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
        resetBtn.disabled = false;
        resetBtn.innerHTML = 'Update Password';
    }
}

// Check if user came from valid reset link
async function checkSession() {
    const messageDiv = document.getElementById('message');
    
    // First, check URL hash for recovery token
    if (window.location.hash && window.location.hash.includes('access_token')) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        
        if (accessToken && type === 'recovery') {
            console.log('✅ Valid reset token found in URL');
            messageDiv.textContent = 'Enter your new password below';
            messageDiv.className = 'message success';
            messageDiv.style.display = 'block';
            
            // Set the session
            const refreshToken = hashParams.get('refresh_token');
            await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
            });
            return;
        }
    }
    
    // If no token in URL, check existing session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        messageDiv.textContent = 'Invalid or expired reset link. Please request a new password reset.';
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
        document.getElementById('resetBtn').disabled = true;
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
            window.location.href = '/Assets/login/admin/admin.html';
        }, 3000);
    } else {
        console.log('✅ Existing session found');
        messageDiv.textContent = 'Enter your new password below';
        messageDiv.className = 'message success';
        messageDiv.style.display = 'block';
    }
}

// Run check when page loads
checkSession();