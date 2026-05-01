    // Student Settings Logic (consistent with dashboard pattern)
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
        } else {
            // Demo student data
            currentStudent = { name: "Alex Rivera", studentId: "CAMP-22123", email: "alex.rivera@campus.edu", phone: "+63 912 345 6789", course: "BS Information Technology", yearLevel: "3" };
            localStorage.setItem('currentStudent', JSON.stringify(currentStudent));
            loadStudentData();
        }
    }

    function loadProfileImage() {
        if (!currentStudent) return;
        const saved = localStorage.getItem(`avatar_${currentStudent.studentId || currentStudent.id}`);
        const preview = document.getElementById('avatarPreview');
        const drawerAvatar = document.getElementById('drawerAvatar');
        if (saved && preview) {
            preview.innerHTML = `<img src="${saved}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            if(drawerAvatar) drawerAvatar.innerHTML = `<img src="${saved}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        } else {
            if(preview && !preview.querySelector('img')) preview.innerHTML = `<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
            if(drawerAvatar && !drawerAvatar.querySelector('img')) drawerAvatar.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
        }
    }

    function saveProfileImage(data) {
        if(!currentStudent) return;
        localStorage.setItem(`avatar_${currentStudent.studentId || currentStudent.id}`, data);
        loadProfileImage();
        showNotification('Profile picture updated!');
    }

    function showAlert(msg, type) {
        const alertDiv = document.getElementById('alertMessage');
        alertDiv.className = `alert ${type}`;
        alertDiv.innerHTML = msg;
        alertDiv.style.display = 'flex';
        setTimeout(() => alertDiv.style.display = 'none', 4000);
    }

    function showNotification(msg) {
        const n = document.createElement('div'); n.className = 'notification'; n.textContent = msg;
        document.body.appendChild(n); setTimeout(()=>n.remove(), 3000);
    }

    function saveProfile() {
        const fullName = document.getElementById('fullName').value;
        if(!fullName) { showAlert('Please enter your name', 'error'); return; }
        currentStudent.name = fullName;
        currentStudent.email = document.getElementById('email').value;
        currentStudent.phone = document.getElementById('phone').value;
        currentStudent.course = document.getElementById('course').value;
        currentStudent.yearLevel = document.getElementById('yearLevel').value;
        localStorage.setItem('currentStudent', JSON.stringify(currentStudent));
        document.getElementById('drawerStudentName').textContent = fullName;
        showAlert('Profile updated successfully!', 'success');
        showNotification('Profile saved');
    }

    function saveNotifications() {
        const prefs = {
            email: document.getElementById('emailNotif').checked,
            incident: document.getElementById('incidentNotif').checked,
            announcement: document.getElementById('announcementNotif').checked
        };
        localStorage.setItem('notifications', JSON.stringify(prefs));
        showAlert('Notification preferences saved!', 'success');
        showNotification('Preferences saved');
    }

    function loadNotifications() {
        const saved = localStorage.getItem('notifications');
        if(saved){
            const prefs = JSON.parse(saved);
            document.getElementById('emailNotif').checked = prefs.email !== undefined ? prefs.email : true;
            document.getElementById('incidentNotif').checked = prefs.incident !== undefined ? prefs.incident : true;
            document.getElementById('announcementNotif').checked = prefs.announcement !== undefined ? prefs.announcement : true;
        }
    }

    function setupAvatarUpload() {
        const uploadBtn = document.getElementById('uploadBtn'), avatarInput = document.getElementById('avatarInput');
        uploadBtn?.addEventListener('click',()=>avatarInput.click());
        avatarInput?.addEventListener('change',(e)=>{
            const file = e.target.files[0];
            if(file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg')){
                const reader = new FileReader();
                reader.onload = (ev)=> saveProfileImage(ev.target.result);
                reader.readAsDataURL(file);
            } else showAlert('Please select a valid image (JPEG/PNG)', 'error');
            avatarInput.value = '';
        });
    }

    function handleLogout() {
        localStorage.removeItem('currentStudent');
        localStorage.removeItem('currentAdmin');
        localStorage.removeItem('isAdminLoggedIn');
        showNotification('Logged out successfully!');
        setTimeout(()=> window.location.href = '/Assets/Landing_page/land.html', 500);
    }

    // Navigation (drawer + bottom nav)
    function setupNavigation() {
        const dashBtn = document.getElementById('dashboardNav');
        if(dashBtn){ const clone = dashBtn.cloneNode(true); dashBtn.parentNode.replaceChild(clone, dashBtn); clone.addEventListener('click',()=>{ if(currentStudent) localStorage.setItem('currentStudent',JSON.stringify(currentStudent)); window.location.href='/Assets/Student_dashboard/SDB.html'; }); }
        const reportBtn = document.getElementById('reportNav');
        if(reportBtn){ const cloneR = reportBtn.cloneNode(true); reportBtn.parentNode.replaceChild(cloneR, reportBtn); cloneR.addEventListener('click',()=>{ if(currentStudent) localStorage.setItem('currentStudent',JSON.stringify(currentStudent)); window.location.href='/Assets/Student_reporting/report.html'; }); }
        const logoutBtn = document.getElementById('logoutBtn');
        if(logoutBtn){ const lo = logoutBtn.cloneNode(true); logoutBtn.parentNode.replaceChild(lo, logoutBtn); lo.addEventListener('click', handleLogout); }
        const mobLogout = document.getElementById('mobileLogoutBtn');
        if(mobLogout){ const mobL = mobLogout.cloneNode(true); mobLogout.parentNode.replaceChild(mobL, mobLogout); mobL.addEventListener('click', handleLogout); }
    }

    // Functional Bottom Nav with Blue Active State
    function initBottomNav() {
        const bottomItems = document.querySelectorAll('.bottom-nav-item');
        const currentPage = 'settings';
        bottomItems.forEach(item => {
            const page = item.getAttribute('data-page');
            if (page === currentPage) item.classList.add('active');
            else item.classList.remove('active');
            const newBtn = item.cloneNode(true);
            item.parentNode.replaceChild(newBtn, item);
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = newBtn.getAttribute('data-page');
                if(currentStudent) localStorage.setItem('currentStudent', JSON.stringify(currentStudent));
                if(targetPage === 'dashboard') window.location.href = '/Assets/Student_dashboard/SDB.html';
                else if(targetPage === 'report') window.location.href = '/Assets/Student_reporting/report.html';
            });
        });
        const activeSetting = document.querySelector('.bottom-nav-item[data-page="settings"]');
        if(activeSetting) activeSetting.classList.add('active');
    }

    // Save buttons
    function attachSaveButtons() {
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        const saveNotifBtn = document.getElementById('saveNotifBtn');
        if(saveProfileBtn){ const sp = saveProfileBtn.cloneNode(true); saveProfileBtn.parentNode.replaceChild(sp, saveProfileBtn); sp.addEventListener('click', saveProfile); }
        if(saveNotifBtn){ const sn = saveNotifBtn.cloneNode(true); saveNotifBtn.parentNode.replaceChild(sn, saveNotifBtn); sn.addEventListener('click', saveNotifications); }
    }

    document.addEventListener('DOMContentLoaded', () => {
        loadStudentData();
        loadNotifications();
        setupAvatarUpload();
        setupNavigation();
        initBottomNav();
        attachSaveButtons();
    });