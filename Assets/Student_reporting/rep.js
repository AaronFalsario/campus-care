
function selCat(element) {
    const allItems = document.querySelectorAll('.cat-item');
    allItems.forEach(item => item.classList.remove('active'));
    element.classList.add('active');
}

function selPriority(element) {
    const allButtons = document.querySelectorAll('.p-btn');
    allButtons.forEach(btn => btn.classList.remove('active'));

    element.classList.add('active');
}

function goBack() {
    window.location.href = '/STUDENTDB/SDB.html';
}

document.addEventListener('DOMContentLoaded', function() {
    const backButton = document.querySelector('.btn-back');
    if (backButton) {
        backButton.addEventListener('click', goBack);
    }
});