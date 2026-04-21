import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://opjyksksnccurdwyskiu.supabase.co'
const supabaseKey = 'sb_publishable_l7mKNQVJ6WesiTM4GJCxQg_oXxTN3it'
const supabase = createClient(supabaseUrl, supabaseKey)

const studentLoginCard = document.getElementById('studentLoginCard');
const signupForm = document.getElementById('signupForm');
const showSignupBtn = document.getElementById('showSignup');
const showLoginBtn = document.getElementById('showLogin');
const roleSelector = document.querySelector('.role-selector');
const adminLoginCard = document.getElementById('adminLoginCard'); 

function isAllowedDomain(email) {
    return email.toLowerCase().endsWith('@gordoncollege.edu.ph');
}

function applySlideUpAnimation(element) {
    element.classList.remove('slideUp');
    void element.offsetWidth;
    element.classList.add('slideUp');
}

function togglePasswordVisibility(inputID, iconID) {
    const input = document.getElementById(inputID);
    const icon = document.getElementById(iconID);
    if (input && icon) {
        icon.addEventListener('click', () => {
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
}

togglePasswordVisibility('passwordInput', 'togglePassword');
togglePasswordVisibility('new-password', 'toggleSignupPassword');

if (showSignupBtn) {
    showSignupBtn.addEventListener('click', function (e) {
        e.preventDefault();
        studentLoginCard.style.display = 'none';
        if (adminLoginCard) adminLoginCard.style.display = 'none';
        if (roleSelector) roleSelector.style.display = 'none';
        signupForm.style.display = 'block';
        applySlideUpAnimation(signupForm);
    });
}

if (showLoginBtn) {
    showLoginBtn.addEventListener('click', function (e) {
        e.preventDefault();
        signupForm.style.display = 'none';
        studentLoginCard.style.display = 'block';
        if (roleSelector) roleSelector.style.display = 'flex';
        applySlideUpAnimation(studentLoginCard);
    });
}

const studentLoginBtn = studentLoginCard.querySelector('.login-btn');
studentLoginBtn.addEventListener('click', async function () {
    const email = studentLoginCard.querySelector('input[type="email"]').value.trim();
    const password = studentLoginCard.querySelector('input[type="password"]').value;

    if(!email || !password) return alert("Please fill in all fields");

    if (!isAllowedDomain(email)) {
        return alert("Access Restricted: Please use your @gordoncollege.edu.ph email.");
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const { data: studentData, error: dbError } = await supabase
            .from('student')
            .select('id')
            .eq('id', data.user.id)
            .single();

        if (studentData) {
            window.location.href = '/Assets/Student_dashboard/SDB.html';
        } else {
            alert('Account not found in student records.');
            await supabase.auth.signOut();
        }
    } catch (error) {
        alert(error.message);
    }
});

signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const fullName = signupForm.querySelectorAll('input[type="text"]')[0].value.trim();
    const studentId = signupForm.querySelectorAll('input[type="text"]')[1].value.trim();
    const email = signupForm.querySelector('input[type="email"]').value.trim();
    const password = signupForm.querySelector('input[type="password"]').value;

    if (!isAllowedDomain(email)) {
        return alert("Invalid Email: You must register with a @gordoncollege.edu.ph account.");
    }

    try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        
        if (error) throw error;
        if (!data.user) throw new Error("Signup failed - no user returned.");

        const { error: dbError } = await supabase
            .from('student')
            .insert([{ 
                id: data.user.id, 
                full_name: fullName, 
                student_id: studentId, 
                email: email 
            }]);

        if (dbError) throw dbError;
        
        alert("Account created successfully!");
        window.location.href = '/Assets/Student_dashboard/SDB.html';
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
});