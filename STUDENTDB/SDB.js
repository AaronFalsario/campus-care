document.addEventListener('DOMContentLoaded', () => {
const drawer  = document.getElementById('drawer');
const overlay = document.getElementById('overlay');
const hamburger  = document.getElementById('hamburger');
const studentDrawerToggle = document.getElementById('studentDrawerToggle');

function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
}

function toggleDrawer() {
    if (drawer.classList.contains('open')) {
        closeDrawer();
    } else {
        openDrawer();
    }
}

if (hamburger) {
    hamburger.addEventListener('click', toggleDrawer);
}

if (studentDrawerToggle) {
    studentDrawerToggle.addEventListener('click', toggleDrawer);
}

overlay.addEventListener('click', closeDrawer);

document.querySelectorAll('.drawer-item').forEach(item => {
    item.addEventListener('click', () => {
    document.querySelectorAll('.drawer-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    });
});

const incidentCards = document.querySelectorAll('.incident-card');

function filterIncidents(category) {
    incidentCards.forEach(card => {
        const cardCategory = card.dataset.category;
        if (category === 'all' || cardCategory === category) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterIncidents(btn.dataset.filter);
    });
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDrawer();
});
});
