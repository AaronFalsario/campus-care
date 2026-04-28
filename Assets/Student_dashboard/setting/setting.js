// Student Settings JavaScript
let currentStudent = null;

function loadStudentData() {
    const stored = localStorage.getItem('currentStudent');
    if (stored) {
        try {
            currentStudent = JSON.parse(stored);
            document.getElementById('drawerStudentName').textContent = currentStudent.name || 'Student';
            document.getElementById('fullName').value = currentStudent.name || '';
            document.getElementById('studentId').value = currentStudent.studentId || currentStudent.id || 'N/A';
            document.getElementById('email').value = currentStudent.email || '';
            document.getElementById('phone').value = currentStudent.phone || '';
            document.getElementById('course').value = currentStudent.course || '';
            document.getElementById('yearLevel').value = currentStudent.yearLevel || '1';
            loadProfileImage();
        } catch(e) { console.error(e); }
    }
}

function loadProfileImage() {
    if (!currentStudent) return;
    const saved = localStorage.getItem(`avatar_${currentStudent.studentId || currentStudent.id}`);
    const preview = document.getElementById('avatarPreview');
    const drawerAvatar = document.getElementById('drawerAvatar');
    if (saved && preview) {
        preview.innerHTML = `<img src="${saved}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        if (drawerAvatar) {
            drawerAvatar.innerHTML = `<img src="${saved}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        }
    }
}

function saveProfileImage(data) {
    if (!currentStudent) return;
    localStorage.setItem(`avatar_${currentStudent.studentId || currentStudent.id}`, data);
    loadProfileImage();
}

function showAlert(msg, type) {
    const alertDiv = document.getElementById('alertMessage');
    alertDiv.className = `alert ${type}`;
    alertDiv.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${msg}`;
    alertDiv.style.display = 'flex';
    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 4000);
}

function showNotification(msg) {
    const n = document.createElement('div');
    n.className = 'notification';
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

function saveProfile() {
    const fullName = document.getElementById('fullName').value;
    if (!fullName) {
        showAlert('Please enter your name', 'error');
        return;
    }
    
    if (currentStudent) {
        currentStudent.name = fullName;
        currentStudent.email = document.getElementById('email').value;
        currentStudent.phone = document.getElementById('phone').value;
        currentStudent.course = document.getElementById('course').value;
        currentStudent.yearLevel = document.getElementById('yearLevel').value;
        localStorage.setItem('currentStudent', JSON.stringify(currentStudent));
        document.getElementById('drawerStudentName').textContent = fullName;
        showAlert('Profile updated successfully!', 'success');
        showNotification('Profile saved!');
    }
}

function saveNotifications() {
    const prefs = {
        email: document.getElementById('emailNotif').checked,
        incident: document.getElementById('incidentNotif').checked,
        announcement: document.getElementById('announcementNotif').checked
    };
    localStorage.setItem('notifications', JSON.stringify(prefs));
    showAlert('Notification preferences saved!', 'success');
    showNotification('Preferences saved!');
}

function loadNotifications() {
    const saved = localStorage.getItem('notifications');
    if (saved) {
        const prefs = JSON.parse(saved);
        document.getElementById('emailNotif').checked = prefs.email !== undefined ? prefs.email : true;
        document.getElementById('incidentNotif').checked = prefs.incident !== undefined ? prefs.incident : true;
        document.getElementById('announcementNotif').checked = prefs.announcement !== undefined ? prefs.announcement : true;
    }
}

function setupAvatarUpload() {
    const uploadBtn = document.getElementById('uploadBtn');
    const avatarInput = document.getElementById('avatarInput');
    
    if (uploadBtn && avatarInput) {
        uploadBtn.addEventListener('click', () => avatarInput.click());
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    saveProfileImage(ev.target.result);
                    showNotification('Profile picture updated!');
                };
                reader.readAsDataURL(file);
            } else {
                showAlert('Please select a valid image (JPEG/PNG)', 'error');
            }
        });
    }
}

function setupNavigation() {
    // Dashboard navigation
    const dashboardNav = document.getElementById('dashboardNav');
    if (dashboardNav) {
        dashboardNav.addEventListener('click', () => {
            window.location.href = '/Assets/Student_dashboard/SDB.html';
        });
    }
    
    // Report navigation
    const reportNav = document.getElementById('reportNav');
    if (reportNav) {
        reportNav.addEventListener('click', () => {
            localStorage.setItem('currentStudent', JSON.stringify(currentStudent));
            window.location.href = '/Assets/Student_reporting/report.html';
        });
    }
    
    // Settings - already on settings page, do nothing but close drawer if needed
    const settingsNav = document.getElementById('settingsNav');
    if (settingsNav) {
        settingsNav.addEventListener('click', () => {
            // Already on settings page
            if (window.closeDrawer) window.closeDrawer();
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('currentStudent');
                showNotification('Logged out successfully');
                setTimeout(() => {
                    window.location.href = '/Assets/Landing_page/land.html';
                }, 1000);
            }
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadStudentData();
    loadNotifications();
    setupAvatarUpload();
    setupNavigation();
    
    // Save buttons
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const saveNotifBtn = document.getElementById('saveNotifBtn');
    
    if (saveProfileBtn) saveProfileBtn.addEventListener('click', saveProfile);
    if (saveNotifBtn) saveNotifBtn.addEventListener('click', saveNotifications);
});