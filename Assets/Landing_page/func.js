// menu
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
        hamburger.querySelector('i').className =
            mobileMenu.classList.contains('open') ? 'fas fa-xmark' : 'fas fa-bars';
    });
}

function closeMenu() {
    mobileMenu.classList.remove('open');
    if (hamburger) {
        hamburger.querySelector('i').className = 'fas fa-bars';
    }
}

// Close menu 
document.addEventListener('click', e => {
    if (hamburger && mobileMenu && !hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('open');
        hamburger.querySelector('i').className = 'fas fa-bars';
    }
});

// fade-up animation
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, i * 80);
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// Footer scroll behavior
const footer = document.querySelector('footer');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const current = window.scrollY;
    const atBottom = window.innerHeight + current >= document.body.scrollHeight - 10;

    if (atBottom) {
        footer.classList.remove('hidden'); 
    } else if (current > lastScroll && current > 100) {
        footer.classList.remove('hidden'); 
    } else {
        footer.classList.add('hidden');   
    }

    lastScroll = current;
});

// Hidden admin trigger (click the dash 3 times)
let adminClickCount = 0;
let adminTimeout;

const adminTrigger = document.getElementById('adminTrigger');
if (adminTrigger) {
    adminTrigger.addEventListener('click', () => {
        adminClickCount++;
        console.log('Admin trigger clicked:', adminClickCount);
        
        clearTimeout(adminTimeout);
        adminTimeout = setTimeout(() => { 
            adminClickCount = 0; 
        }, 800);
        
        if (adminClickCount === 3) {
            console.log('Redirecting to admin page...');
            window.location.href = '/Assets/login/admin/admin.html';
        }
    });
} else {
    console.log('Admin trigger element not found - make sure <span id="adminTrigger"> exists');
}