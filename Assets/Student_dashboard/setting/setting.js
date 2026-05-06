    // ========== STUDENT DATA ==========
    let currentStudent = null;

    function loadStudentData() {
        const stored = localStorage.getItem('currentStudent');
        if (stored) {
            try {
                currentStudent = JSON.parse(stored);
                
                // Desktop
                document.getElementById('drawerStudentName').textContent = currentStudent.name || 'Student';
                document.getElementById('fullNameDesktop').value = currentStudent.name || '';
                document.getElementById('studentIdDesktop').value = currentStudent.studentId || 'N/A';
                document.getElementById('emailDesktop').value = currentStudent.email || '';
                document.getElementById('phoneDesktop').value = currentStudent.phone || '';
                document.getElementById('courseDesktop').value = currentStudent.course || '';
                document.getElementById('yearLevelDesktop').value = currentStudent.yearLevel || '1';
                
                // Mobile
                document.getElementById('mobileName').textContent = currentStudent.name || 'Student';
                document.getElementById('mobileEmail').textContent = currentStudent.email || 'student@campus.edu';
                document.getElementById('mobileAccountSub').textContent = currentStudent.name || 'Account';
                document.getElementById('mobileFullNameInput').value = currentStudent.name || '';
                document.getElementById('mobileStudentIdInput').value = currentStudent.studentId || 'N/A';
                document.getElementById('mobileEmailInput').value = currentStudent.email || '';
                
                const initial = (currentStudent.name || 'S').charAt(0).toUpperCase();
                document.getElementById('mobileAvatar').textContent = initial;
                
                loadProfileImage();
            } catch(e) { console.error(e); }
        }
    }

    function saveProfileMobile() {
        const newName = document.getElementById('mobileFullNameInput').value;
        if (!newName) { showToast('Please enter your name'); return; }
        currentStudent.name = newName;
        localStorage.setItem('currentStudent', JSON.stringify(currentStudent));
        loadStudentData();
        showToast('Profile updated successfully!');
        closeProfileModalMobile();
    }

    // Profile Image
    function loadProfileImage() {
        if (!currentStudent) return;
        const saved = localStorage.getItem(`avatar_${currentStudent.studentId}`);
        if (saved) {
            const previewDesktop = document.getElementById('avatarPreviewDesktop');
            const drawerAvatar = document.getElementById('drawerAvatar');
            const mobileAvatar = document.getElementById('mobileAvatar');
            if (previewDesktop) previewDesktop.innerHTML = `<img src="${saved}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            if (drawerAvatar) drawerAvatar.innerHTML = `<img src="${saved}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            if (mobileAvatar) mobileAvatar.innerHTML = `<img src="${saved}" style="width:70px;height:70px;object-fit:cover;border-radius:50%">`;
        }
    }

    // Avatar Upload
    function setupAvatarUpload() {
        const uploadBtn = document.getElementById('uploadBtnDesktop');
        const avatarInput = document.getElementById('avatarInputDesktop');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => avatarInput.click());
            avatarInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        const imageData = ev.target.result;
                        localStorage.setItem(`avatar_${currentStudent.studentId}`, imageData);
                        loadProfileImage();
                        showToast('Profile picture updated!');
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }

    // ========== NOTIFICATION SETTINGS ==========
    function loadNotificationSettings() {
        const saved = localStorage.getItem('student_notification_prefs');
        const prefs = saved ? JSON.parse(saved) : { email: true, push: true };
        
        // Desktop
        document.getElementById('emailNotifDesktop').checked = prefs.email;
        document.getElementById('incidentNotifDesktop').checked = prefs.incident !== undefined ? prefs.incident : true;
        document.getElementById('announcementNotifDesktop').checked = prefs.announcement !== undefined ? prefs.announcement : true;
        
        // Mobile
        document.getElementById('mobileEmailNotif').checked = prefs.email;
        document.getElementById('mobilePushNotif').checked = prefs.push;
        document.getElementById('mobileNotifStatus').textContent = (prefs.email || prefs.push) ? 'Allowed' : 'Disabled';
    }

    function saveNotificationSettingsMobile() {
        const prefs = {
            email: document.getElementById('mobileEmailNotif').checked,
            push: document.getElementById('mobilePushNotif').checked,
            incident: document.getElementById('incidentNotifDesktop').checked,
            announcement: document.getElementById('announcementNotifDesktop').checked
        };
        localStorage.setItem('student_notification_prefs', JSON.stringify(prefs));
        document.getElementById('mobileNotifStatus').textContent = (prefs.email || prefs.push) ? 'Allowed' : 'Disabled';
        showToast('Notification preferences saved!');
        closeNotificationsModalMobile();
    }

    function saveNotificationSettingsDesktop() {
        const prefs = {
            email: document.getElementById('emailNotifDesktop').checked,
            incident: document.getElementById('incidentNotifDesktop').checked,
            announcement: document.getElementById('announcementNotifDesktop').checked,
            push: document.getElementById('mobilePushNotif')?.checked || true
        };
        localStorage.setItem('student_notification_prefs', JSON.stringify(prefs));
        showToast('Notification preferences saved!');
    }

    // ========== LANGUAGE ==========
    let currentLanguage = 'English';
    
    function loadLanguage() {
        const saved = localStorage.getItem('student_language');
        if (saved) {
            currentLanguage = saved;
            document.getElementById('mobileLanguage').textContent = currentLanguage;
        }
    }
    
    function selectLanguageMobile(lang) {
        currentLanguage = lang;
        localStorage.setItem('student_language', lang);
        document.getElementById('mobileLanguage').textContent = lang;
        showToast(`Language changed to ${lang}`);
        closeLanguageModalMobile();
    }

    // ========== FEEDBACK ==========
    function sendFeedbackMobile() {
        const feedback = document.getElementById('feedbackTextMobile').value;
        if (!feedback) { showToast('Please enter your feedback'); return; }
        const feedbacks = JSON.parse(localStorage.getItem('student_feedback') || '[]');
        feedbacks.unshift({ text: feedback, date: new Date().toISOString(), student: currentStudent?.name });
        localStorage.setItem('student_feedback', JSON.stringify(feedbacks));
        showToast('Thank you for your feedback!');
        document.getElementById('feedbackTextMobile').value = '';
        closeFeedbackModalMobile();
    }

    function rateUsMobile() {
        window.open('https://github.com', '_blank');
        showToast('Thanks for rating us!');
    }

    // ========== DARK MODE ==========
    function initDarkMode() {
        const saved = localStorage.getItem('darkMode');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (saved === 'enabled' || (!saved && prefersDark)) enableDarkMode();
        else disableDarkMode();
        
        const desktopToggle = document.getElementById('darkModeToggleDesktop');
        const mobileToggle = document.getElementById('darkModeToggleMobile');
        if (desktopToggle) desktopToggle.addEventListener('click', toggleDarkMode);
        if (mobileToggle) mobileToggle.addEventListener('change', toggleDarkMode);
    }
    
    function toggleDarkMode() {
        if (document.body.classList.contains('dark-mode')) disableDarkMode();
        else enableDarkMode();
    }
    
    function enableDarkMode() {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');
        updateDarkModeIcons(true);
        const mobileToggle = document.getElementById('darkModeToggleMobile');
        if (mobileToggle) mobileToggle.checked = true;
    }
    
    function disableDarkMode() {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'disabled');
        updateDarkModeIcons(false);
        const mobileToggle = document.getElementById('darkModeToggleMobile');
        if (mobileToggle) mobileToggle.checked = false;
    }
    
    function updateDarkModeIcons(isDark) {
        const sunIcon = document.querySelector('.sun-icon');
        const moonIcon = document.querySelector('.moon-icon');
        if (sunIcon && moonIcon) {
            sunIcon.style.display = isDark ? 'none' : 'block';
            moonIcon.style.display = isDark ? 'block' : 'none';
        }
    }

    // ========== NAVIGATION ==========
    function goBack() {
        window.location.href = '/Assets/Student_dashboard/SDB.html';
    }
    
    function confirmLogoutDesktop() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('currentStudent');
            showToast('Logged out successfully');
            setTimeout(() => window.location.href = '/land.html', 1000);
        }
    }
    
    function confirmLogoutMobile() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('currentStudent');
            showToast('Logged out successfully');
            setTimeout(() => window.location.href = '/land.html', 1000);
        }
    }

    // Setup Navigation
    function setupNavigation() {
        document.getElementById('dashboardNav')?.addEventListener('click', () => window.location.href = '/Assets/Student_dashboard/SDB.html');
        document.getElementById('reportNav')?.addEventListener('click', () => window.location.href = '/Assets/Student_reporting/report.html');
        document.getElementById('logoutBtn')?.addEventListener('click', confirmLogoutDesktop);
        document.getElementById('mobileLogoutBtnDesktop')?.addEventListener('click', confirmLogoutDesktop);
        document.getElementById('saveProfileBtnDesktop')?.addEventListener('click', () => {
            const newName = document.getElementById('fullNameDesktop').value;
            if (newName) {
                currentStudent.name = newName;
                currentStudent.email = document.getElementById('emailDesktop').value;
                currentStudent.phone = document.getElementById('phoneDesktop').value;
                currentStudent.course = document.getElementById('courseDesktop').value;
                currentStudent.yearLevel = document.getElementById('yearLevelDesktop').value;
                localStorage.setItem('currentStudent', JSON.stringify(currentStudent));
                loadStudentData();
                showToast('Profile updated!');
            }
        });
        document.getElementById('saveNotifBtnDesktop')?.addEventListener('click', saveNotificationSettingsDesktop);
    }

    // Setup Bottom Nav
    function setupBottomNav() {
        const items = document.querySelectorAll('.bottom-nav-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page === 'dashboard') window.location.href = '/Assets/Student_dashboard/SDB.html';
                else if (page === 'report') window.location.href = '/Assets/Student_reporting/report.html';
            });
        });
    }

    // ========== MODAL FUNCTIONS ==========
    function openProfileModalMobile() {
        document.getElementById('profileModalMobile').classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    window.closeProfileModalMobile = function() {
        document.getElementById('profileModalMobile').classList.remove('active');
        document.body.style.overflow = '';
    };
    window.saveProfileMobile = saveProfileMobile;

    function openNotificationsModalMobile() {
        loadNotificationSettings();
        document.getElementById('notificationsModalMobile').classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    window.closeNotificationsModalMobile = function() {
        document.getElementById('notificationsModalMobile').classList.remove('active');
        document.body.style.overflow = '';
    };
    window.saveNotificationSettingsMobile = saveNotificationSettingsMobile;

    function openLanguageModalMobile() {
        document.getElementById('languageModalMobile').classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    window.closeLanguageModalMobile = function() {
        document.getElementById('languageModalMobile').classList.remove('active');
        document.body.style.overflow = '';
    };
    window.selectLanguageMobile = selectLanguageMobile;

    function openFeedbackModalMobile() {
        document.getElementById('feedbackModalMobile').classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    window.closeFeedbackModalMobile = function() {
        document.getElementById('feedbackModalMobile').classList.remove('active');
        document.body.style.overflow = '';
    };
    window.sendFeedbackMobile = sendFeedbackMobile;
    window.rateUsMobile = rateUsMobile;
    window.confirmLogoutMobile = confirmLogoutMobile;
    window.confirmLogoutDesktop = confirmLogoutDesktop;

    // ========== TOAST ==========
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOutToast 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ========== NOTIFICATION BELL ==========
    let notifications = [];
    let unreadCount = 0;
    
    function loadNotificationsList() {
        const saved = localStorage.getItem('student_notifications');
        if (saved) {
            notifications = JSON.parse(saved);
            updateBadge();
        }
    }
    
    function updateBadge() {
        unreadCount = notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notifBadgeDesktop');
        if (badge) {
            if (unreadCount > 0) {
                badge.style.display = 'flex';
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            } else {
                badge.style.display = 'none';
            }
        }
    }

    function setupNotificationBell() {
        const bell = document.getElementById('notificationBtnDesktop');
        const panel = document.getElementById('notificationPanelDesktop');
        if (bell) {
            bell.addEventListener('click', (e) => {
                e.stopPropagation();
                panel.classList.toggle('active');
                renderNotificationsDesktop();
            });
        }
        document.addEventListener('click', (e) => {
            if (panel && !panel.contains(e.target) && bell && !bell.contains(e.target)) {
                panel.classList.remove('active');
            }
        });
        const clearBtn = document.getElementById('clearNotificationsBtnDesktop');
        if (clearBtn) clearBtn.addEventListener('click', () => {
            notifications = [];
            localStorage.setItem('student_notifications', JSON.stringify(notifications));
            updateBadge();
            renderNotificationsDesktop();
            showToast('All notifications cleared');
        });
    }

    function renderNotificationsDesktop() {
        const list = document.getElementById('notificationListDesktop');
        if (!list) return;
        if (notifications.length === 0) {
            list.innerHTML = `<div class="notification-empty"><div>🔔</div><p>No notifications yet</p></div>`;
            return;
        }
        list.innerHTML = notifications.map(n => `
            <div class="notification-item ${!n.read ? 'unread' : ''}" data-id="${n.id}">
                <div class="notification-title">${escapeHtml(n.title)}</div>
                <div class="notification-message">${escapeHtml(n.message)}</div>
                <div class="notification-time">${getTimeAgo(new Date(n.timestamp))}</div>
            </div>
        `).join('');
        document.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.dataset.id);
                const notif = notifications.find(n => n.id === id);
                if (notif && !notif.read) {
                    notif.read = true;
                    localStorage.setItem('student_notifications', JSON.stringify(notifications));
                    updateBadge();
                    renderNotificationsDesktop();
                }
            });
        });
    }

    function getTimeAgo(date) {
        const diff = Math.floor((Date.now() - date) / 1000);
        if (diff < 60) return 'Just now';
        const mins = Math.floor(diff / 60);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ========== INITIALIZATION ==========
    document.addEventListener('DOMContentLoaded', () => {
        loadStudentData();
        loadNotificationSettings();
        loadLanguage();
        loadNotificationsList();
        setupAvatarUpload();
        setupNavigation();
        setupBottomNav();
        setupNotificationBell();
        initDarkMode();
    });