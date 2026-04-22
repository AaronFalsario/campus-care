import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://opjyksksnccurdwyskiu.supabase.co'
const supabaseKey = 'sb_publishable_l7mKNQVJ6WesiTM4GJCxQg_oXxTN3it'
const supabase = createClient(supabaseUrl, supabaseKey)

const adminLoginCard = document.getElementById('adminLoginCard');
const adminLoginBtn = adminLoginCard.querySelector('.admin-btn');
const passwordInput = document.getElementById('adminPasswordInput');
const togglePassword = document.getElementById('toggleAdminPassword');

togglePassword.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.classList.toggle('fa-eye-slash');
});

adminLoginBtn.addEventListener('click', async function () {
    const email = document.getElementById('adminEmail').value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        alert("Please fill in all fields");
        return;
    }

    try {
        adminLoginBtn.disabled = true;
        adminLoginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) throw error;

        const { data: adminData, error: dbError } = await supabase
            .from('admins')
            .select('role')
            .eq('id', data.user.id)
            .single();

        if (dbError || !adminData || adminData.role !== 'admin') {
            await supabase.auth.signOut();
            throw new Error('Unauthorized access. Admin records not found.');
        }

        adminLoginBtn.style.backgroundColor = '#059669';
        adminLoginBtn.innerHTML = '<i class="fas fa-check"></i> Success!';

        setTimeout(() => {
            window.location.href = '/Assets/Admin_dashboard/Admin.html';
        }, 800);

    } catch (error) {
        adminLoginCard.classList.add('shake');
        setTimeout(() => adminLoginCard.classList.remove('shake'), 400);
        
        alert(error.message);
        adminLoginBtn.disabled = false;
        adminLoginBtn.innerHTML = 'Login';
    }
});