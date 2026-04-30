// Student Settings JavaScript
let currentStudent = null;

function loadStudentData() {
    const stored = localStorage.getItem('currentStudent');
    if (stored) {
        try {
            currentStudent = JSON.parse(stored);
            
            // Update drawer name
            const drawerName = document.getElementById('drawerStudentName');
            if (drawerName) drawerName.textContent = currentStudent.name || 'Student';
            
            // Update form fields
            const fullNameInput = document.getElementById('fullName');
            const studentIdInput = document.getElementById('studentId');
            const emailInput = document.getElementById('email');
            const phoneInput = document.getElementById('phone');
            const courseInput = document.getElementById('course');
            const yearLevelSelect = document.getElementById('yearLevel');
            
            if (fullNameInput) fullNameInput.value = currentStudent.name || '';
            if (studentIdInput) studentIdInput.value = currentStudent.studentId || currentStudent.id || 'N/A';
            if (emailInput) emailInput.value = currentStudent.email || '';
            if (phoneInput) phoneInput.value = currentStudent.phone || '';
            if (courseInput) courseInput.value = currentStudent.course || '';
            if (yearLevelSelect) yearLevelSelect.value = currentStudent.yearLevel || '1';
            
            loadProfileImage();
        } catch(e) { 
            console.error('Error loading student data:', e);
        }
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
    } else {
        // Default avatar if no image saved
        if (preview && !preview.querySelector('img')) {
            preview.innerHTML = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
            </svg>`;
        }
        if (drawerAvatar && !drawerAvatar.querySelector('img')) {
            drawerAvatar.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
            </svg>`;
        }
    }
}

function saveProfileImage(data) {
    if (!currentStudent) return;
    localStorage.setItem(`avatar_${currentStudent.studentId || currentStudent.id}`, data);
    loadProfileImage();
    showNotification('Profile picture updated!');
}

function showAlert(msg, type) {
    const alertDiv = document.getElementById('alertMessage');
    if (!alertDiv) return;
    
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
        
        // Update drawer name
        const drawerName = document.getElementById('drawerStudentName');
        if (drawerName) drawerName.textContent = fullName;
        
        showAlert('Profile updated successfully!', 'success');
        showNotification('Profile saved!');
    }
}

function saveNotifications() {
    const prefs = {
        email: document.getElementById('emailNotif') ? document.getElementById('emailNotif').checked : true,
        incident: document.getElementById('incidentNotif') ? document.getElementById('incidentNotif').checked : true,
        announcement: document.getElementById('announcementNotif') ? document.getElementById('announcementNotif').checked : true
    };
    localStorage.setItem('notifications', JSON.stringify(prefs));
    showAlert('Notification preferences saved!', 'success');
    showNotification('Preferences saved!');
}

function loadNotifications() {
    const saved = localStorage.getItem('notifications');
    if (saved) {
        try {
            const prefs = JSON.parse(saved);
            const emailNotif = document.getElementById('emailNotif');
            const incidentNotif = document.getElementById('incidentNotif');
            const announcementNotif = document.getElementById('announcementNotif');
            
            if (emailNotif) emailNotif.checked = prefs.email !== undefined ? prefs.email : true;
            if (incidentNotif) incidentNotif.checked = prefs.incident !== undefined ? prefs.incident : true;
            if (announcementNotif) announcementNotif.checked = prefs.announcement !== undefined ? prefs.announcement : true;
        } catch(e) {
            console.error('Error loading notifications:', e);
        }
    }
}

function setupAvatarUpload() {
    const uploadBtn = document.getElementById('uploadBtn');
    const avatarInput = document.getElementById('avatarInput');
    
    if (uploadBtn && avatarInput) {
        const newUploadBtn = uploadBtn.cloneNode(true);
        uploadBtn.parentNode.replaceChild(newUploadBtn, uploadBtn);
        
        newUploadBtn.addEventListener('click', () => avatarInput.click());
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    saveProfileImage(ev.target.result);
                    showNotification('Profile picture updated!');
                };
                reader.readAsDataURL(file);
            } else {
                showAlert('Please select a valid image (JPEG/PNG)', 'error');
            }
            avatarInput.value = '';
        });
    }
}

// ============ LOGOUT FUNCTION - NO CONFIRMATION FOR MOBILE ============
function handleLogout() {
    // Clear all user data - no confirmation for mobile
    localStorage.removeItem('currentStudent');
    localStorage.removeItem('currentAdmin');
    localStorage.removeItem('isAdminLoggedIn');
    
    showNotification('Logged out successfully!');
    
    setTimeout(() => {
        window.location.href = '/Assets/Landing_page/land.html';
    }, 500);
}

function setupNavigation() {
    // Dashboard navigation
    const dashboardNav = document.getElementById('dashboardNav');
    if (dashboardNav) {
        const newDashboardNav = dashboardNav.cloneNode(true);
        dashboardNav.parentNode.replaceChild(newDashboardNav, dashboardNav);
        newDashboardNav.addEventListener('click', () => {
            if (currentStudent) localStorage.setItem('currentStudent', JSON.stringify(currentStudent));
            window.location.href = '/Assets/Student_dashboard/SDB.html';
        });
    }
    
    // Report navigation
    const reportNav = document.getElementById('reportNav');
    if (reportNav) {
        const newReportNav = reportNav.cloneNode(true);
        reportNav.parentNode.replaceChild(newReportNav, reportNav);
        newReportNav.addEventListener('click', () => {
            if (currentStudent) localStorage.setItem('currentStudent', JSON.stringify(currentStudent));
            window.location.href = '/Assets/Student_reporting/report.html';
        });
    }
    
    // Settings navigation
    const settingsNav = document.getElementById('settingsNav');
    if (settingsNav) {
        const newSettingsNav = settingsNav.cloneNode(true);
        settingsNav.parentNode.replaceChild(newSettingsNav, settingsNav);
        newSettingsNav.addEventListener('click', () => {
            if (window.closeDrawer) window.closeDrawer();
        });
    }
    
    // Desktop LOGOUT BUTTON (in drawer) - NO CONFIRMATION
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        newLogoutBtn.addEventListener('click', handleLogout);
    }
    
    // Mobile LOGOUT BUTTON (in settings page) - NO CONFIRMATION
    let mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    
    if (!mobileLogoutBtn) {
        mobileLogoutBtn = document.querySelector('.mobile-logout-btn');
    }
    
    if (mobileLogoutBtn) {
        console.log('Mobile logout button found, attaching event listener');
        const newMobileLogoutBtn = mobileLogoutBtn.cloneNode(true);
        mobileLogoutBtn.parentNode.replaceChild(newMobileLogoutBtn, mobileLogoutBtn);
        newMobileLogoutBtn.addEventListener('click', handleLogout);
    }
    
    // Any other button with Logout text
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(btn => {
        if (btn.textContent.trim() === 'Logout' && btn !== logoutBtn && !btn.classList.contains('processed')) {
            btn.classList.add('processed');
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', handleLogout);
        }
    });
}

function initializeDrawer() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('overlay');
    const hamburger = document.getElementById('hamburger');
    
    if (!drawer) return;
    
    window.openDrawer = () => {
        drawer.classList.add('open');
        if (overlay) overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    };
    
    window.closeDrawer = () => {
        drawer.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = '';
    };
    
    if (hamburger) {
        const newHamburger = hamburger.cloneNode(true);
        hamburger.parentNode.replaceChild(newHamburger, hamburger);
        newHamburger.addEventListener('click', window.openDrawer);
    }
    
    if (overlay) {
        overlay.addEventListener('click', window.closeDrawer);
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') window.closeDrawer();
    });
    
    document.querySelectorAll('.drawer-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) window.closeDrawer();
        });
    });
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    console.log('Settings page loaded');
    initializeDrawer();
    loadStudentData();
    loadNotifications();
    setupAvatarUpload();
    setupNavigation();
    
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const saveNotifBtn = document.getElementById('saveNotifBtn');
    
    if (saveProfileBtn) {
        const newSaveProfileBtn = saveProfileBtn.cloneNode(true);
        saveProfileBtn.parentNode.replaceChild(newSaveProfileBtn, saveProfileBtn);
        newSaveProfileBtn.addEventListener('click', saveProfile);
    }
    
    if (saveNotifBtn) {
        const newSaveNotifBtn = saveNotifBtn.cloneNode(true);
        saveNotifBtn.parentNode.replaceChild(newSaveNotifBtn, saveNotifBtn);
        newSaveNotifBtn.addEventListener('click', saveNotifications);
    }
});