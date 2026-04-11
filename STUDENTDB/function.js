document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    });
});