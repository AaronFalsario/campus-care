import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Password visibility toggle
document.addEventListener('DOMContentLoaded', () => {
    const toggleNew = document.getElementById('toggleNewPassword');
    const toggleConfirm = document.getElementById('toggleConfirmPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (toggleNew && newPasswordInput) {
        toggleNew.addEventListener('click', () => {
            const type = newPasswordInput.type === 'password' ? 'text' : 'password';
            newPasswordInput.type = type;
            toggleNew.classList.toggle('fa-eye-slash');
        });
    }
    
    if (toggleConfirm && confirmPasswordInput) {
        toggleConfirm.addEventListener('click', () => {
            const type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
            confirmPasswordInput.type = type;
            toggleConfirm.classList.toggle('fa-eye-slash');
        });
    }
});

function showMessage(message, isError = false) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${isError ? 'error' : 'success'}`;
        messageDiv.style.display = 'block';
        if (!isError) {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
    }
}

async function updatePassword() {
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    const resetBtn = document.getElementById('resetBtn');
    
    if (!newPassword || !confirmPassword) {
        showMessage('Please fill in both fields', true);
        return;
    }
    
    if (newPassword.length < 6) {
        showMessage('Password must be at least 6 characters', true);
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showMessage('Passwords do not match', true);
        return;
    }
    
    resetBtn.disabled = true;
    resetBtn.innerHTML = '<span class="loader"></span> Updating...';
    
    try {
        // Check URL hash for recovery token
        if (window.location.hash && window.location.hash.includes('access_token')) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            const type = hashParams.get('type');
            
            if (accessToken && type === 'recovery') {
                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                });
                if (sessionError) throw new Error('Invalid or expired reset link');
            } else {
                throw new Error('Invalid reset link');
            }
        } else {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No valid reset session found');
        }
        
        // Update the password
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        
        showMessage('✅ Password updated successfully! Redirecting to admin login...', false);
        
        // Clear stored admin session
        localStorage.removeItem('currentAdmin');
        localStorage.removeItem('isAdminLoggedIn');
        
        setTimeout(() => {
            window.location.href = '/Assets/login/admin/admin.html';
        }, 2000);
        
    } catch (error) {
        console.error('Password update error:', error);
        showMessage(error.message || 'Failed to update password', true);
        resetBtn.disabled = false;
        resetBtn.innerHTML = 'Update Password';
    }
}

async function checkSession() {
    const hasToken = window.location.hash && window.location.hash.includes('access_token');
    if (!hasToken) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            showMessage('Invalid or expired reset link. Please request a new password reset.', true);
            const resetBtn = document.getElementById('resetBtn');
            if (resetBtn) resetBtn.disabled = true;
            setTimeout(() => {
                window.location.href = '/Assets/login/admin/admin.html';
            }, 3000);
        }
    }
}

const resetBtn = document.getElementById('resetBtn');
if (resetBtn) {
    resetBtn.addEventListener('click', updatePassword);
}

checkSession();