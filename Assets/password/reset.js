        import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
        
        const supabaseUrl = 'https://opjyksksnccurdwyskiu.supabase.co'
        const supabaseKey = 'sb_publishable_l7mKNQVJ6WesiTM4GJCxQg_oXxTN3it'
        const supabase = createClient(supabaseUrl, supabaseKey)
        
        const resetForm = document.getElementById('resetForm');
        const resetBtn = document.getElementById('resetBtn');
        const messageDiv = document.getElementById('message');
        const subtitle = document.getElementById('subtitle');
        
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('resetEmail').value.trim();
            
            if (!email) {
                showMessage('Please enter your email address', 'error');
                return;
            }
            
            resetBtn.disabled = true;
            resetBtn.textContent = 'Sending...';
            
            try {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/Assets/login/update-password.html'
                });
                
                if (error) throw error;
                
                showMessage('✅ Password reset email sent! Check your inbox.', 'success');
                resetForm.reset();
                subtitle.textContent = 'Check your email for the reset link';
                resetBtn.textContent = 'Sent!';
            } catch (error) {
                console.error('Reset error:', error);
                showMessage('❌ ' + (error.message || 'Failed to send reset email'), 'error');
                resetBtn.textContent = 'Send Reset Link';
                resetBtn.disabled = false;
            }
        });
        
        function showMessage(msg, type) {
            messageDiv.textContent = msg;
            messageDiv.className = `message ${type}`;
            setTimeout(() => {
                messageDiv.style.display = 'none';
                messageDiv.className = 'message';
            }, 5000);
        }