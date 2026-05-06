// ========== TRANSLATIONS ==========

const translations = {
    en: {
        // Navigation
        'dashboard': 'Dashboard',
        'report': 'New Report',
        'settings': 'Settings',
        'home': 'Home',
        'profile': 'Profile',
        
        // Common
        'welcome_back': 'Welcome back',
        'edit_profile': 'Edit Profile',
        'logout': 'Logout',
        'save_changes': 'Save Changes',
        'cancel': 'Cancel',
        'loading': 'Loading...',
        
        // Settings Page
        'settings_title': 'Settings',
        'settings_subtitle': 'Manage your account and preferences',
        'profile_information': 'Profile Information',
        'update_personal_details': 'Update your personal details',
        'full_name': 'Full Name',
        'student_id': 'Student ID',
        'email_address': 'Email Address',
        'contact_number': 'Contact Number',
        'course_program': 'Course/Program',
        'year_level': 'Year Level',
        'change_photo': 'Change Photo',
        
        // Notifications
        'notifications': 'Notifications',
        'choose_alerts': 'Choose what alerts you receive',
        'email_notifications': 'Email Notifications',
        'receive_updates_via_email': 'Receive updates via email',
        'incident_updates': 'Incident Updates',
        'get_notified_about_reports': 'Get notified about report status changes',
        'campus_announcements': 'Campus Announcements',
        'receive_important_news': 'Receive important campus news',
        'save_preferences': 'Save Preferences',
        
        // Mobile Sections
        'account': 'ACCOUNT',
        'your_account': 'Your account',
        'dark_mode': 'Dark Mode',
        'switch_light_dark': 'Switch between light and dark theme',
        'notifications_section': 'NOTIFICATIONS',
        'language_section': 'LANGUAGE',
        'about_us': 'ABOUT US',
        'rate_us': 'Rate us',
        'write_about_us': 'Write about us in your store',
        'feedback': 'Feedback',
        'write_your_opinion': 'Write your opinion for us',
        'danger_zone': 'DANGER ZONE',
        'log_out': 'Log out',
        'sign_out_account': 'Sign out of your account',
        
        // Modals
        'edit_profile_title': 'Edit Profile',
        'notification_settings': 'Notification Settings',
        'select_language': 'Select Language',
        'send_feedback': 'Send Feedback',
        'your_feedback': 'Your Feedback',
        'write_opinion': 'Write your opinion about CampusCare...',
        'send': 'Send',
        
        // Stats
        'your_reports': 'Your Reports',
        'in_progress': 'In Progress',
        'resolved': 'Resolved',
        'total_campus_reports': 'Total Campus Reports',
        
        // Filter
        'all_reports': 'All Reports',
        'security': 'Security',
        'maintenance': 'Maintenance',
        'janitorial': 'Janitorial',
        'facilities': 'Facilities',
        'view_my_reports': 'View My Reports',
        
        // Toast Messages
        'profile_updated': 'Profile updated successfully!',
        'settings_saved': 'Settings saved!',
        'feedback_thanks': 'Thank you for your feedback! 🎉',
        'logout_success': 'Logged out successfully',
        'language_changed': 'Language changed to',
        'dark_mode_enabled': 'Dark mode enabled 🌙',
        'light_mode_enabled': 'Light mode enabled ☀️',
        
        // Empty states
        'no_feedback': 'No feedback submitted yet',
        'no_notifications': 'No notifications yet',
        
        // Status
        'pending': 'pending',
        'resolved_status': 'resolved',
        'in_progress_status': 'in-progress',
        
        // Ratings
        'select_rating': 'Select rating',
        'excellent': 'Excellent',
        'good': 'Good',
        'average': 'Average',
        'poor': 'Poor',
        'very_poor': 'Very Poor',
        
        // Categories
        'general_feedback': 'General Feedback',
        'bug_report': 'Bug Report',
        'feature_request': 'Feature Request',
        'improvement_suggestion': 'Improvement Suggestion',
        'complaint': 'Complaint',
        
        // Confirm dialogs
        'confirm_logout': 'Are you sure you want to logout?',
        'confirm_clear': 'Clear all notifications?',
        'enter_name': 'Please enter your name',
        'enter_feedback': 'Please enter your feedback'
    },
    
    tl: { // Filipino/Tagalog
        // Navigation
        'dashboard': 'Dashboard',
        'report': 'Bagong Ulat',
        'settings': 'Mga Setting',
        'home': 'Bahay',
        'profile': 'Profile',
        
        // Common
        'welcome_back': 'Maligayang pagbabalik',
        'edit_profile': 'I-edit ang Profile',
        'logout': 'Mag-logout',
        'save_changes': 'I-save ang mga Pagbabago',
        'cancel': 'Kanselahin',
        'loading': 'Naglo-load...',
        
        // Settings Page
        'settings_title': 'Mga Setting',
        'settings_subtitle': 'Pamahalaan ang iyong account at mga kagustuhan',
        'profile_information': 'Impormasyon ng Profile',
        'update_personal_details': 'I-update ang iyong personal na impormasyon',
        'full_name': 'Buong Pangalan',
        'student_id': 'ID ng Mag-aaral',
        'email_address': 'Email Address',
        'contact_number': 'Numero ng Telepono',
        'course_program': 'Kurso/Programa',
        'year_level': 'Antas ng Taon',
        'change_photo': 'Palitan ang Larawan',
        
        // Notifications
        'notifications': 'Mga Abiso',
        'choose_alerts': 'Pumili ng mga alerto na iyong matatanggap',
        'email_notifications': 'Mga Abiso sa Email',
        'receive_updates_via_email': 'Tumanggap ng mga update sa pamamagitan ng email',
        'incident_updates': 'Mga Update sa Insidente',
        'get_notified_about_reports': 'Makatanggap ng abiso tungkol sa status ng ulat',
        'campus_announcements': 'Mga Anunsyo sa Campus',
        'receive_important_news': 'Tumanggap ng mahahalagang balita sa campus',
        'save_preferences': 'I-save ang mga Kagustuhan',
        
        // Mobile Sections
        'account': 'ACCOUNT',
        'your_account': 'Iyong account',
        'dark_mode': 'Madilim na Mode',
        'switch_light_dark': 'Lumipat sa pagitan ng maliwanag at madilim na tema',
        'notifications_section': 'MGA ABISO',
        'language_section': 'WIKA',
        'about_us': 'TUNGKOL SA AMIN',
        'rate_us': 'I-rate kami',
        'write_about_us': 'Sumulat tungkol sa amin sa iyong store',
        'feedback': 'Feedback',
        'write_your_opinion': 'Isulat ang iyong opinyon para sa amin',
        'danger_zone': 'DELIKADONG SONA',
        'log_out': 'Mag-logout',
        'sign_out_account': 'Mag-sign out sa iyong account',
        
        // Modals
        'edit_profile_title': 'I-edit ang Profile',
        'notification_settings': 'Mga Setting ng Abiso',
        'select_language': 'Pumili ng Wika',
        'send_feedback': 'Magpadala ng Feedback',
        'your_feedback': 'Iyong Feedback',
        'write_opinion': 'Isulat ang iyong opinyon tungkol sa CampusCare...',
        'send': 'Ipadala',
        
        // Stats
        'your_reports': 'Iyong mga Ulat',
        'in_progress': 'Isinasagawa',
        'resolved': 'Naresolba',
        'total_campus_reports': 'Kabuuang Ulat sa Campus',
        
        // Filter
        'all_reports': 'Lahat ng Ulat',
        'security': 'Seguridad',
        'maintenance': 'Pagpapanatili',
        'janitorial': 'Paglilinis',
        'facilities': 'Pasilidad',
        'view_my_reports': 'Tingnan ang Aking mga Ulat',
        
        // Toast Messages
        'profile_updated': 'Matagumpay na na-update ang profile!',
        'settings_saved': 'Na-save ang mga setting!',
        'feedback_thanks': 'Salamat sa iyong feedback! 🎉',
        'logout_success': 'Matagumpay na naka-logout',
        'language_changed': 'Ang wika ay pinalitan sa',
        'dark_mode_enabled': 'Pinagana ang madilim na mode 🌙',
        'light_mode_enabled': 'Pinagana ang maliwanag na mode ☀️',
        
        // Empty states
        'no_feedback': 'Wala pang naisumiteng feedback',
        'no_notifications': 'Wala pang abiso',
        
        // Status
        'pending': 'nakabinbin',
        'resolved_status': 'naresolba',
        'in_progress_status': 'isinasagawa',
        
        // Ratings
        'select_rating': 'Pumili ng rating',
        'excellent': 'Napakahusay',
        'good': 'Mabuti',
        'average': 'Katamtaman',
        'poor': 'Mahina',
        'very_poor': 'Napakahina',
        
        // Categories
        'general_feedback': 'Pangkalahatang Feedback',
        'bug_report': 'Ulat ng Bug',
        'feature_request': 'Kahilingan ng Tampok',
        'improvement_suggestion': 'Mungkahi ng Pagpapabuti',
        'complaint': 'Reklamo',
        
        // Confirm dialogs
        'confirm_logout': 'Sigurado ka bang gusto mong mag-logout?',
        'confirm_clear': 'Linisin lahat ng abiso?',
        'enter_name': 'Pakilagay ang iyong pangalan',
        'enter_feedback': 'Pakilagay ang iyong feedback'
    }
};

let currentLanguage = 'en';

// Get translation
function t(key) {
    return translations[currentLanguage][key] || translations['en'][key] || key;
}

// Set language and update UI
function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('student_language', lang);
    document.documentElement.lang = lang === 'tl' ? 'tl' : 'en';
    updateAllText();
    showToast(`${t('language_changed')} ${lang === 'tl' ? 'Tagalog' : 'English'}`);
}

// Update all text on the page
function updateAllText() {
    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            if (el.placeholder) el.placeholder = t(key);
        } else {
            el.textContent = t(key);
        }
    });
    
    // Update stats labels
    const yourReportsLabel = document.querySelector('.stat-card .stat-label:first-child');
    if (yourReportsLabel) yourReportsLabel.textContent = t('your_reports');
    
    const inProgressLabel = document.querySelectorAll('.stat-card .stat-label')[1];
    if (inProgressLabel) inProgressLabel.textContent = t('in_progress');
    
    const resolvedLabel = document.querySelectorAll('.stat-card .stat-label')[2];
    if (resolvedLabel) resolvedLabel.textContent = t('resolved');
    
    const totalLabel = document.querySelectorAll('.stat-card .stat-label')[3];
    if (totalLabel) totalLabel.textContent = t('total_campus_reports');
    
    // Update filter chips
    const filterChips = document.querySelectorAll('.filter-chip');
    const filterKeys = ['all_reports', 'security', 'maintenance', 'janitorial', 'facilities'];
    filterChips.forEach((chip, index) => {
        if (filterKeys[index]) chip.textContent = t(filterKeys[index]);
    });
    
    // Update view toggle button
    const viewToggle = document.getElementById('viewModeToggle');
    if (viewToggle) {
        const isMyReports = viewToggle.textContent.includes('My Reports') || viewToggle.textContent.includes('Aking');
        viewToggle.textContent = isMyReports ? t('view_my_reports') : t('all_reports');
    }
    
    // Update welcome message
    const welcomeMsg = document.getElementById('welcomeMessage');
    if (welcomeMsg && currentStudent) {
        const firstName = currentStudent.name ? currentStudent.name.split(' ')[0] : 'Student';
        welcomeMsg.innerHTML = `${t('welcome_back')}, ${firstName}! 👋`;
    }
    
    // Update mobile section headers
    const mobileHeaders = document.querySelectorAll('.mobile-section-header span');
    const headerKeys = ['account', 'notifications_section', 'about_us', 'danger_zone'];
    mobileHeaders.forEach((header, index) => {
        if (headerKeys[index]) header.textContent = t(headerKeys[index]);
    });
    
    // Update mobile settings items
    const mobileTitles = document.querySelectorAll('.mobile-item-title');
    const titleKeys = [
        'your_account', 'dark_mode', 'notifications', 'language_section',
        'rate_us', 'feedback', 'log_out'
    ];
    mobileTitles.forEach((title, index) => {
        if (titleKeys[index]) title.textContent = t(titleKeys[index]);
    });
    
    // Update mobile subs
    const mobileSubs = document.querySelectorAll('.mobile-item-sub');
    const subKeys = ['switch_light_dark', 'write_about_us', 'write_your_opinion', 'sign_out_account'];
    mobileSubs.forEach((sub, index) => {
        if (subKeys[index]) sub.textContent = t(subKeys[index]);
    });
    
    // Update edit badge
    const editBadge = document.querySelector('.edit-badge');
    if (editBadge) editBadge.innerHTML = `<i class="fas fa-pen"></i> ${t('edit_profile')}`;
    
    // Update modal headers
    const modalHeaders = document.querySelectorAll('.modal-header h3');
    const modalKeys = ['edit_profile_title', 'notification_settings', 'select_language', 'send_feedback'];
    modalHeaders.forEach((header, index) => {
        if (modalKeys[index]) {
            const icon = header.querySelector('i');
            header.innerHTML = icon ? `${icon.outerHTML} ${t(modalKeys[index])}` : t(modalKeys[index]);
        }
    });
    
    // Update button texts
    const saveBtns = document.querySelectorAll('.btn-save');
    saveBtns.forEach(btn => {
        if (btn.textContent.includes('Save') || btn.textContent.includes('I-save')) {
            btn.textContent = t('save_changes');
        } else if (btn.textContent.includes('Send') || btn.textContent.includes('Ipadala')) {
            btn.textContent = t('send');
        }
    });
    
    const cancelBtns = document.querySelectorAll('.btn-cancel');
    cancelBtns.forEach(btn => btn.textContent = t('cancel'));
    
    // Update drawer items
    const drawerItems = document.querySelectorAll('.drawer-item span');
    const drawerKeys = ['dashboard', 'report', 'settings'];
    drawerItems.forEach((item, index) => {
        if (drawerKeys[index]) item.textContent = t(drawerKeys[index]);
    });
    
    // Update logout button
    const logoutBtn = document.querySelector('.drawer-logout span');
    if (logoutBtn) logoutBtn.textContent = t('logout');
    
    // Update bottom nav items
    const bottomNavSpans = document.querySelectorAll('.bottom-nav-item span');
    const bottomKeys = ['home', 'report', 'settings'];
    bottomNavSpans.forEach((span, index) => {
        if (bottomKeys[index]) span.textContent = t(bottomKeys[index]);
    });
    
    // Update rating options
    const ratingSelect = document.getElementById('feedbackRating');
    if (ratingSelect) {
        const options = ratingSelect.options;
        if (options.length > 0) {
            options[0].text = t('select_rating');
            if (options[1]) options[1].text = `★★★★★ - ${t('excellent')}`;
            if (options[2]) options[2].text = `★★★★☆ - ${t('good')}`;
            if (options[3]) options[3].text = `★★★☆☆ - ${t('average')}`;
            if (options[4]) options[4].text = `★★☆☆☆ - ${t('poor')}`;
            if (options[5]) options[5].text = `★☆☆☆☆ - ${t('very_poor')}`;
        }
    }
    
    // Update category options
    const categorySelect = document.getElementById('feedbackCategory');
    if (categorySelect) {
        const options = categorySelect.options;
        const categoryKeys = ['general_feedback', 'bug_report', 'feature_request', 'improvement_suggestion', 'complaint'];
        for (let i = 0; i < options.length && i < categoryKeys.length; i++) {
            options[i].text = t(categoryKeys[i]);
        }
    }
    
    // Update feedback label
    const feedbackLabel = document.querySelector('#feedbackModalMobile .form-group label');
    if (feedbackLabel) {
        feedbackLabel.innerHTML = `${t('your_feedback')} <span style="color: red;">*</span>`;
    }
    
    // Update feedback placeholder
    const feedbackTextarea = document.getElementById('feedbackTextMobile');
    if (feedbackTextarea) feedbackTextarea.placeholder = t('write_opinion');
    
    // Update notification settings labels in modal
    const notifLabels = document.querySelectorAll('#notificationsModalMobile .form-group');
    if (notifLabels.length >= 2) {
        const emailLabel = notifLabels[0]?.querySelector('label');
        if (emailLabel) emailLabel.innerHTML = `📧 ${t('email_notifications')}`;
        
        const pushLabel = notifLabels[1]?.querySelector('label');
        if (pushLabel) pushLabel.innerHTML = `🔔 ${t('push_notifications')}`;
    }
    
    // Update profile modal labels
    const profileLabels = document.querySelectorAll('#profileModalMobile .form-group label');
    const profileLabelKeys = ['full_name', 'student_id', 'email_address'];
    profileLabels.forEach((label, index) => {
        if (profileLabelKeys[index]) label.textContent = t(profileLabelKeys[index]);
    });
    
    // Update page header
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) pageTitle.textContent = t('settings_title');
    
    const pageSub = document.querySelector('.page-sub');
    if (pageSub) pageSub.textContent = t('settings_subtitle');
    
    // Update card headers
    const cardHeaders = document.querySelectorAll('.card-header h2');
    const cardHeaderKeys = ['profile_information', 'notifications'];
    cardHeaders.forEach((header, index) => {
        if (cardHeaderKeys[index]) header.textContent = t(cardHeaderKeys[index]);
    });
    
    const cardSubs = document.querySelectorAll('.card-header p');
    const cardSubKeys = ['update_personal_details', 'choose_alerts'];
    cardSubs.forEach((sub, index) => {
        if (cardSubKeys[index]) sub.textContent = t(cardSubKeys[index]);
    });
    
    // Update form labels
    const formLabels = document.querySelectorAll('.form-group label');
    const formLabelKeys = ['full_name', 'student_id', 'email_address', 'contact_number', 'course_program', 'year_level'];
    formLabels.forEach((label, index) => {
        if (formLabelKeys[index]) label.textContent = t(formLabelKeys[index]);
    });
    
    // Update toggle item labels
    const toggleLabels = document.querySelectorAll('.toggle-info span');
    const toggleLabelKeys = ['email_notifications', 'incident_updates', 'campus_announcements'];
    toggleLabels.forEach((label, index) => {
        if (toggleLabelKeys[index]) label.textContent = t(toggleLabelKeys[index]);
    });
    
    const toggleSubs = document.querySelectorAll('.toggle-info p');
    const toggleSubKeys = ['receive_updates_via_email', 'get_notified_about_reports', 'receive_important_news'];
    toggleSubs.forEach((sub, index) => {
        if (toggleSubKeys[index]) sub.textContent = t(toggleSubKeys[index]);
    });
}

// Update selectLanguageMobile function
function selectLanguageMobile(lang) {
    setLanguage(lang === 'English' ? 'en' : 'tl');
    closeLanguageModalMobile();
    
    // Update the displayed language in settings
    const mobileLanguage = document.getElementById('mobileLanguage');
    if (mobileLanguage) mobileLanguage.textContent = lang === 'English' ? 'English' : 'Tagalog';
    
    // Update check marks
    const checkEnglish = document.getElementById('checkEnglishMobile');
    const checkFilipino = document.getElementById('checkFilipinoMobile');
    if (checkEnglish) checkEnglish.style.display = lang === 'English' ? 'block' : 'none';
    if (checkFilipino) checkFilipino.style.display = lang === 'Filipino' ? 'block' : 'none';
}

// Also update confirm dialogs to use translated text
window.confirmLogoutMobile = function() {
    if (confirm(t('confirm_logout'))) {
        localStorage.removeItem('currentStudent');
        showToast(t('logout_success'));
        setTimeout(() => window.location.href = '/land.html', 1000);
    }
};

window.confirmLogoutDesktop = function() {
    if (confirm(t('confirm_logout'))) {
        localStorage.removeItem('currentStudent');
        showToast(t('logout_success'));
        setTimeout(() => window.location.href = '/land.html', 1000);
    }
};