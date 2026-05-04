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
                // Update the user's password
                const { error } = await supabase.auth.updateUser({ 
                    password: newPassword 
                });

                if (error) throw error;

                messageDiv.textContent = '✅ Password updated successfully! Redirecting to login...';
                messageDiv.className = 'message success';
                messageDiv.style.display = 'block';

                // Redirect to login page after 2 seconds
                setTimeout(() => {
                    window.location.href = '/Assets/login/log.html';
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
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                const messageDiv = document.getElementById('message');
                messageDiv.textContent = 'Invalid or expired reset link. Please request a new password reset.';
                messageDiv.className = 'message error';
                messageDiv.style.display = 'block';
                document.getElementById('resetBtn').disabled = true;
                
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    window.location.href = '/Assets/login/log.html';
                }, 3000);
            }
        }

        checkSession();