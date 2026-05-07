// Student Forgot Password Function
async function studentForgotPassword() {
    const email = prompt('Please enter your registered student email address:');
    
    if (email && email.trim()) {
        const trimmedEmail = email.trim().toLowerCase();
        
        // Check if email domain is valid
        if (!trimmedEmail.endsWith('@gordoncollege.edu.ph')) {
            showToast('Please use your @gordoncollege.edu.ph email address', true);
            return;
        }
        
        showToast('Sending reset link...', false);
        
        try {
            // Send password reset email (pointing to student reset page)
            const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
                redirectTo: `${window.location.origin}/Assets/login/student/reset-password.html?type=student`
            });
            
            if (error) throw error;
            
            showToast(`✅ Password reset link sent to ${trimmedEmail}! Check your inbox.`, false);
            
        } catch (error) {
            console.error('Password reset error:', error);
            showToast(error.message || 'Failed to send reset email. Please try again.', true);
        }
    }
}

// Attach to your Forgot Password button (add this where you initialize your event listeners)
const forgotPasswordBtn = document.getElementById('showForgotPassword');
if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', studentForgotPassword);
}