import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const STORAGE_KEY = 'campus_care_reports';
let currentStudent = null;
let currentFilter = 'all';
let allIncidents = [];
let viewMode = 'all';  
let refreshInterval = null;
let realtimeSubscription = null;

// Sensitive categories and keywords for security reports
const SENSITIVE_CATEGORIES = ['weapon', 'violence', 'threat', 'danger', 'security', 'harassment', 'bullying', 'gun', 'firearm', 'knife', 'assault'];
const SECURITY_KEYWORDS = ['gun', 'firearm', 'weapon', 'knife', 'blade', 'shooting', 'threat', 'danger', 'violence'];

// Function to check if a report is security-sensitive
function isSecuritySensitive(incident) {
    if (!incident) return false;
    
    // Check category
    if (incident.category && SENSITIVE_CATEGORIES.includes(incident.category.toLowerCase())) {
        return true;
    }
    
    // Check title for security keywords
    if (incident.name) {
        const titleLower = incident.name.toLowerCase();
        if (SECURITY_KEYWORDS.some(keyword => titleLower.includes(keyword))) {
            return true;
        }
    }
    
    // Check description for security keywords
    if (incident.description) {
        const descLower = incident.description.toLowerCase();
        if (SECURITY_KEYWORDS.some(keyword => descLower.includes(keyword))) {
            return true;
        }
    }
    
    return false;
}

// Function to get safe reporter name (hidden for security reports)
function getSafeReporterName(incident, isYourReport) {
    // If it's the user's own report, they can see their own name
    if (isYourReport) {
        if (incident.is_anonymous === 'true') {
            return 'Anonymous Reporter';
        }
        return incident.reporter || 'You';
    }
    
    // Check if this is a security-sensitive report
    if (isSecuritySensitive(incident)) {
        return '🔒 Confidential Reporter';
    }
    
    // For non-security reports, show the reporter name (or anonymous)
    if (incident.is_anonymous === 'true') {
        return 'Anonymous Reporter';
    }
    
    return incident.reporter || 'Another Student';
}

// Function to get safe description (hidden for security reports)
function getSafeDescription(incident, isYourReport, canSeeDetails) {
    if (isYourReport || canSeeDetails) {
        return incident.description || 'No description provided';
    }
    
    // For security reports that aren't yours, hide description
    if (isSecuritySensitive(incident)) {
        return '🔒 This report contains sensitive security information and has been restricted.';
    }
    
    return incident.description || 'No description provided';
}

// ========== TRANSLATIONS ==========
const translations = {
    en: {
        'dashboard': 'Dashboard',
        'report': 'New Report',
        'settings': 'Settings',
        'home': 'Home',
        'logout': 'Logout',
        'your_reports': 'Your Reports',
        'in_progress': 'In Progress',
        'resolved': 'Resolved',
        'total_campus_reports': 'Total Campus Reports',
        'all_reports': 'All Reports',
        'security': 'Security',
        'maintenance': 'Maintenance',
        'janitorial': 'Janitorial',
        'facilities': 'Facilities',
        'view_my_reports': 'View My Reports',
        'your_report': 'Your Report',
        'by': 'By',
        'sensitive_report': '🔒 Sensitive report - details restricted to security personnel',
        'reported_by_you': 'Reported by you',
        'reported_by': 'Reported by',
        'restricted': '🔒 Restricted',
        'confidential_reporter': '🔒 Confidential Reporter',
        'incident_details': 'Incident Details',
        'title': 'Title',
        'location': 'Location',
        'category': 'Category',
        'priority': 'Priority',
        'status': 'Status',
        'description': 'Description',
        'date': 'Date',
        'close': 'Close',
        'security_restriction': '⚠️ Security Restriction',
        'security_message': 'This report contains sensitive safety information. Campus security has been notified and is handling the situation.',
        'confidential': '🔒 Confidential - Reporter Identity Protected',
        'you': 'You',
        'another_student': 'Another Student',
        'pending': 'Pending',
        'high': 'High',
        'medium': 'Medium',
        'low': 'Low',
        'security_cat': 'Security',
        'maintenance_cat': 'Maintenance',
        'janitorial_cat': 'Janitorial',
        'facilities_cat': 'Facilities',
        'no_reports_yet': 'No reports yet',
        'click_new_report': 'Click the "New Report" button to submit your first incident report',
        'no_incidents_reported': 'No incidents reported yet',
        'be_first_to_report': 'Be the first to report an incident!',
        'new_report_update': 'New Report Update',
        'new_reports_added': 'new report has been added to your reports',
        'new_reports_added_plural': 'new reports have been added to your reports',
        'report_status_update': 'Report Status Update',
        'being_processed': 'Your report is now being processed',
        'has_been_resolved': 'Your report has been resolved!',
        'pending_review': 'Your report is pending review',
        'welcome_back': 'Welcome back',
        'logged_out': 'Logged out successfully',
        'profile_updated': 'Profile picture updated successfully!',
        'invalid_image': 'Please select a valid image file (JPEG, PNG)',
        'confirm_logout': 'Are you sure you want to logout?',
        'no_notifications': 'No notifications yet',
        'clear_all': 'Clear all',
        'notifications_cleared': 'All notifications cleared',
        'dark_mode_enabled': 'Dark mode enabled 🌙',
        'light_mode_enabled': 'Light mode enabled ☀️'
    },
    tl: {
        'dashboard': 'Dashboard',
        'report': 'Bagong Ulat',
        'settings': 'Mga Setting',
        'home': 'Bahay',
        'logout': 'Mag-logout',
        'your_reports': 'Iyong mga Ulat',
        'in_progress': 'Isinasagawa',
        'resolved': 'Naresolba',
        'total_campus_reports': 'Kabuuang Ulat sa Campus',
        'all_reports': 'Lahat ng Ulat',
        'security': 'Seguridad',
        'maintenance': 'Pagpapanatili',
        'janitorial': 'Paglilinis',
        'facilities': 'Pasilidad',
        'view_my_reports': 'Tingnan ang Aking mga Ulat',
        'your_report': 'Iyong Ulat',
        'by': 'Ni',
        'sensitive_report': '🔒 Sensitibong ulat - ang mga detalye ay para lamang sa seguridad',
        'reported_by_you': 'Ulat mo',
        'reported_by': 'Ulat ni',
        'restricted': '🔒 Limitado',
        'confidential_reporter': '🔒 Kumpidensyal na Reporter',
        'incident_details': 'Detalye ng Insidente',
        'title': 'Pamagat',
        'location': 'Lokasyon',
        'category': 'Kategorya',
        'priority': 'Priyoridad',
        'status': 'Status',
        'description': 'Paglalarawan',
        'date': 'Petsa',
        'close': 'Isara',
        'security_restriction': '⚠️ Restriksyon sa Seguridad',
        'security_message': 'Ang ulat na ito ay naglalaman ng sensitibong impormasyon. Ang seguridad ng campus ay naabisuhan at hinahawakan ang sitwasyon.',
        'confidential': '🔒 Kumpidensyal - Protektado ang Pagkakakilanlan',
        'you': 'Ikaw',
        'another_student': 'Ibang Mag-aaral',
        'pending': 'Nakabinbin',
        'high': 'Mataas',
        'medium': 'Katamtaman',
        'low': 'Mababa',
        'security_cat': 'Seguridad',
        'maintenance_cat': 'Pagpapanatili',
        'janitorial_cat': 'Paglilinis',
        'facilities_cat': 'Pasilidad',
        'no_reports_yet': 'Wala pang ulat',
        'click_new_report': 'I-click ang "Bagong Ulat" para magsumite ng iyong unang ulat',
        'no_incidents_reported': 'Wala pang naiulat na insidente',
        'be_first_to_report': 'Maging una upang mag-ulat ng insidente!',
        'new_report_update': 'Bagong Update sa Ulat',
        'new_reports_added': 'bagong ulat ay naidagdag sa iyong mga ulat',
        'new_reports_added_plural': 'bagong mga ulat ay naidagdag sa iyong mga ulat',
        'report_status_update': 'Update sa Status ng Ulat',
        'being_processed': 'Ang iyong ulat ay kasalukuyang pinoproseso',
        'has_been_resolved': 'Ang iyong ulat ay naresolba na!',
        'pending_review': 'Ang iyong ulat ay naghihintay ng pagsusuri',
        'welcome_back': 'Maligayang pagbabalik',
        'logged_out': 'Matagumpay na naka-logout',
        'profile_updated': 'Matagumpay na na-update ang larawan ng profile!',
        'invalid_image': 'Mangyaring pumili ng wastong larawan (JPEG, PNG)',
        'confirm_logout': 'Sigurado ka bang gusto mong mag-logout?',
        'no_notifications': 'Wala pang abiso',
        'clear_all': 'Linisin lahat',
        'notifications_cleared': 'Linisin lahat ng abiso',
        'dark_mode_enabled': 'Pinagana ang madilim na mode 🌙',
        'light_mode_enabled': 'Pinagana ang maliwanag na mode ☀️'
    }
};

let currentLanguage = 'en';

function t(key) {
    return translations[currentLanguage][key] || translations['en'][key] || key;
}

function updateUIText() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            const placeholderKey = el.getAttribute('data-i18n-placeholder');
            if (placeholderKey) el.placeholder = t(placeholderKey);
        } else {
            el.textContent = t(key);
        }
    });
    
    const statLabels = document.querySelectorAll('.stat-label');
    const statKeys = ['your_reports', 'in_progress', 'resolved', 'total_campus_reports'];
    statLabels.forEach((label, index) => {
        if (statKeys[index]) label.textContent = t(statKeys[index]);
    });
    
    const filterChips = document.querySelectorAll('.filter-chip');
    const filterKeys = ['all_reports', 'security', 'maintenance', 'janitorial', 'facilities'];
    filterChips.forEach((chip, index) => {
        if (filterKeys[index] && !chip.id) {
            chip.textContent = t(filterKeys[index]);
        }
    });
    
    const viewToggle = document.getElementById('viewModeToggle');
    if (viewToggle) {
        viewToggle.innerHTML = viewMode === 'my' ? '🌐 ' + t('all_reports') : '📋 ' + t('view_my_reports');
    }
    
    const sectionTitle = document.querySelector('.section-title');
    if (sectionTitle) sectionTitle.textContent = t('recent_incidents') || 'Recent Incidents';
    
    const drawerSpans = document.querySelectorAll('.drawer-item span');
    const drawerKeys = ['dashboard', 'report', 'settings'];
    drawerSpans.forEach((span, index) => {
        if (drawerKeys[index]) span.textContent = t(drawerKeys[index]);
    });
    
    const logoutSpan = document.querySelector('.drawer-logout span');
    if (logoutSpan) logoutSpan.textContent = t('logout');
    
    const bottomSpans = document.querySelectorAll('.bottom-nav-item span');
    const bottomKeys = ['home', 'report', 'settings'];
    bottomSpans.forEach((span, index) => {
        if (bottomKeys[index]) span.textContent = t(bottomKeys[index]);
    });
}

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('student_language', lang);
    document.documentElement.lang = lang === 'tl' ? 'tl' : 'en';
    updateUIText();
    loadAndDisplayReports();
}

function loadLanguage() {
    const saved = localStorage.getItem('student_language');
    if (saved === 'tl') {
        setLanguage('tl');
    } else {
        setLanguage('en');
    }
}

// ========== NOTIFICATION SYSTEM ==========
let notifications = [];
let unreadCount = 0;

function loadNotifications() {
    const saved = localStorage.getItem('student_notifications');
    if (saved) {
        notifications = JSON.parse(saved);
        updateNotificationBadge();
    }
}

function saveNotifications() {
    localStorage.setItem('student_notifications', JSON.stringify(notifications));
}

function addNotification(title, message, type = 'info') {
    const notification = {
        id: Date.now(),
        title: t(title) || title,
        message: t(message) || message,
        type: type,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    notifications.unshift(notification);
    saveNotifications();
    updateNotificationBadge();
    showNotificationToast(notification.title, notification.message);
    
    if (notifications.length > 50) {
        notifications = notifications.slice(0, 50);
        saveNotifications();
    }
}

function updateNotificationBadge() {
    unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        if (unreadCount > 0) {
            badge.style.display = 'flex';
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        } else {
            badge.style.display = 'none';
        }
    }
}

function showNotificationToast(title, message) {
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
        <div class="toast-content">
            <strong>${escapeHtml(title)}</strong>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
    toast.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        background: var(--surface);
        border-left: 4px solid var(--primary);
        border-radius: 12px;
        padding: 12px 16px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
        color: var(--text);
        border: 1px solid var(--border);
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function renderNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    const list = document.getElementById('notificationList');
    
    if (!panel || !list) return;
    
    if (notifications.length === 0) {
        list.innerHTML = `
            <div class="notification-empty">
                <div>🔔</div>
                <p>${t('no_notifications')}</p>
                <small>You'll see updates here when reports are updated</small>
            </div>
        `;
        return;
    }
    
    list.innerHTML = notifications.map(notif => `
        <div class="notification-item ${!notif.read ? 'unread' : ''}" data-id="${notif.id}">
            <div class="notification-title">${escapeHtml(notif.title)}</div>
            <div class="notification-message">${escapeHtml(notif.message)}</div>
            <div class="notification-time">${getTimeAgo(new Date(notif.timestamp))}</div>
        </div>
    `).join('');
    
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.dataset.id);
            markNotificationAsRead(id);
        });
    });
}

function markNotificationAsRead(id) {
    const notif = notifications.find(n => n.id === id);
    if (notif && !notif.read) {
        notif.read = true;
        saveNotifications();
        updateNotificationBadge();
        renderNotificationPanel();
    }
}

function clearAllNotifications() {
    if (confirm(t('clear_all') + '?')) {
        notifications = [];
        saveNotifications();
        updateNotificationBadge();
        renderNotificationPanel();
        showNotification(t('notifications_cleared'));
    }
}

function createNotificationPanel() {
    if (document.getElementById('notificationPanel')) return;
    
    const panelHTML = `
        <div id="notificationPanel" class="notification-panel">
            <div class="notification-header">
                <h4>🔔 ${t('notifications') || 'Notifications'}</h4>
                <button class="notification-clear" id="clearNotificationsBtn">${t('clear_all')}</button>
            </div>
            <div id="notificationList" class="notification-list"></div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', panelHTML);
    
    const clearBtn = document.getElementById('clearNotificationsBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllNotifications);
    }
    
    renderNotificationPanel();
}

function setupNotificationSystem() {
    createNotificationPanel();
    loadNotifications();
    
    const notifBtn = document.getElementById('notificationBtn');
    const panel = document.getElementById('notificationPanel');
    
    if (notifBtn) {
        const newNotifBtn = notifBtn.cloneNode(true);
        notifBtn.parentNode.replaceChild(newNotifBtn, notifBtn);
        
        newNotifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.classList.toggle('active');
            renderNotificationPanel();
        });
    }
    
    document.addEventListener('click', (e) => {
        const panelEl = document.getElementById('notificationPanel');
        const btnEl = document.getElementById('notificationBtn');
        if (panelEl && !panelEl.contains(e.target) && btnEl && !btnEl.contains(e.target)) {
            panelEl.classList.remove('active');
        }
    });
}

// ========== DARK MODE SYSTEM ==========
function initDarkMode() {
    console.log('Initializing dark mode...');
    
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedMode === 'enabled' || (!savedMode && prefersDark)) {
        enableDarkMode();
    } else {
        disableDarkMode();
    }
    
    const toggleBtn = document.getElementById('darkModeToggle');
    if (toggleBtn) {
        const newToggleBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
        
        newToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleDarkMode();
        });
        console.log('Dark mode button setup complete');
    }
}

function toggleDarkMode() {
    const isDark = document.body.classList.contains('dark-mode');
    if (isDark) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
}

function enableDarkMode() {
    document.body.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'enabled');
    updateDarkModeIcons(true);
    showNotification(t('dark_mode_enabled'));
}

function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', 'disabled');
    updateDarkModeIcons(false);
    showNotification(t('light_mode_enabled'));
}

function updateDarkModeIcons(isDark) {
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    
    if (sunIcon && moonIcon) {
        if (isDark) {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    }
}

// ========== AUTO-NOTIFICATIONS ==========
let lastIncidentCount = 0;
let lastStatusUpdates = {};

function checkForUpdates() {
    if (!currentStudent) return;
    
    const myReports = allIncidents.filter(inc => 
        String(inc.student_id) === String(currentStudent?.studentId)
    );
    
    if (myReports.length > lastIncidentCount && lastIncidentCount !== 0) {
        const newCount = myReports.length - lastIncidentCount;
        addNotification(
            'new_report_update',
            `${newCount} ${newCount === 1 ? 'new_reports_added' : 'new_reports_added_plural'}`,
            'info'
        );
    }
    
    myReports.forEach(report => {
        const lastStatus = lastStatusUpdates[report.id];
        if (lastStatus && lastStatus !== report.status) {
            let statusMessage = '';
            if (report.status === 'in-progress') {
                statusMessage = 'being_processed';
            } else if (report.status === 'resolved') {
                statusMessage = 'has_been_resolved';
            } else if (report.status === 'pending') {
                statusMessage = 'pending_review';
            }
            
            if (statusMessage) {
                addNotification(
                    'report_status_update',
                    statusMessage,
                    report.status === 'resolved' ? 'success' : 'info'
                );
            }
        }
        lastStatusUpdates[report.id] = report.status;
    });
    
    lastIncidentCount = myReports.length;
}

// ========== AUTHENTICATION ==========
async function checkAuth() {
    const stored = localStorage.getItem('currentStudent');
    console.log('Stored student in localStorage:', stored);
    
    if (!stored) {
        console.log('No stored student, redirecting to landing page');
        window.location.href = '/Assets/Landing_page/land.html';
        return false;
    }
    
    try {
        const localStudent = JSON.parse(stored);
        console.log('Parsed local student:', localStudent);
        
        const { data: studentData, error } = await supabase
            .from('student')
            .select('*')
            .eq('student_id', localStudent.studentId)
            .single();
        
        if (error) {
            console.error('Student not found in database:', error);
            currentStudent = {
                id: localStudent.studentId,
                studentId: localStudent.studentId,
                name: localStudent.name || localStudent.full_name || 'Student',
                email: localStudent.email || '',
                role: 'student'
            };
        } else {
            console.log('Student found in database:', studentData);
            currentStudent = {
                id: studentData.id,
                studentId: studentData.student_id,
                name: studentData.full_name,
                email: studentData.email,
                role: 'student'
            };
            localStorage.setItem('currentStudent', JSON.stringify(currentStudent));
        }
        
        console.log('Final currentStudent:', currentStudent);
        return true;
        
    } catch(e) {
        console.error('Auth error:', e);
        currentStudent = {
            id: 'guest',
            studentId: 'guest',
            name: 'Student',
            email: '',
            role: 'student'
        };
        return true;
    }
}

function canStudentSeeDescription(incident) {
    if (!currentStudent) return false;
    if (String(incident.student_id) === String(currentStudent?.studentId)) {
        return true;
    }
    if (isSecuritySensitive(incident)) {
        return false;
    }
    if (incident.category && SENSITIVE_CATEGORIES.includes(incident.category.toLowerCase())) {
        return false;
    }
    return true;
}

function getSafeLocation(incident) {
    if (!currentStudent) return incident.location || 'Location not specified';
    if (String(incident.student_id) === String(currentStudent?.studentId)) {
        return incident.location || 'Location not specified';
    }
    
    if (isSecuritySensitive(incident)) {
        return '<span class="location-restricted">🔒 LOCATION RESTRICTED - Security Purposes</span>';
    }
    
    if (incident.category === 'security') {
        return '<span class="location-restricted">🔒 LOCATION RESTRICTED 🔒</span>';
    }
    
    if (incident.category && SENSITIVE_CATEGORIES.includes(incident.category.toLowerCase())) {
        const generalArea = incident.location ? (incident.location.split(',')[0] || incident.location.split('-')[0]) : 'Campus';
        return `📍 ${generalArea} (restricted)`;
    }
    
    return incident.location || 'Location not specified';
}

function getSafeTitle(incident) {
    if (!currentStudent) return incident.name || 'Incident Report';
    if (canStudentSeeDescription(incident)) {
        return incident.name;
    }
    if (isSecuritySensitive(incident)) {
        return '⚠️ SECURITY ALERT - Details Restricted ⚠️';
    }
    if (incident.category === 'security') {
        return '⚠️ Security Alert - Admin Notified';
    }
    return '⚠️ Safety Alert - Details Restricted';
}

// ========== LOAD INCIDENTS ==========
async function loadIncidents() {
    try {
        console.log('Loading incidents from Supabase incident table...');
        
        const { data: incidents, error } = await supabase
            .from('incident')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Supabase error:', error);
            loadFromLocalStorage();
            return;
        }
        
        if (incidents && incidents.length > 0) {
            allIncidents = incidents.map(r => ({
                id: r.id,
                name: r.title,
                location: r.location,
                category: r.category || 'maintenance',
                priority: r.priority || 'medium',
                status: r.status || 'pending',
                reporter: r.student_name,
                student_id: r.student_id_number,
                description: r.description || 'No description provided',
                timestamp: new Date(r.created_at),
                image_url: r.image_url || null,
                is_anonymous: r.is_anonymous
            }));
            
            console.log(`Loaded ${allIncidents.length} incidents from Supabase`);
        } else {
            allIncidents = [];
            console.log('No incidents found in Supabase');
        }
        
        loadAndDisplayReports();
        updateStats();
        
    } catch (error) {
        console.error('Error loading from Supabase:', error);
        loadFromLocalStorage();
    }
}

function loadFromLocalStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored !== '[]') {
        const reports = JSON.parse(stored);
        allIncidents = reports.map(r => ({
            id: r.id,
            name: r.title,
            location: r.location,
            category: r.category || 'maintenance',
            priority: r.priority || 'medium',
            status: r.status || 'pending',
            reporter: r.student_name || r.studentName,
            student_id: r.student_id_number || r.studentId,
            description: r.description || 'No description provided',
            timestamp: new Date(r.created_at || r.timestamp),
            image_url: r.image_url || r.imageUrl || null,
            is_anonymous: r.is_anonymous
        }));
    } else {
        allIncidents = [];
    }
    loadAndDisplayReports();
    updateStats();
}

// ============ REAL-TIME SUBSCRIPTION ============
let isInitialLoad = true;

function setupRealtimeSubscription() {
    if (realtimeSubscription) return;
    
    console.log('Setting up real-time subscription for incident table...');
    
    realtimeSubscription = supabase
        .channel('incident-changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'incident' },
            (payload) => {
                console.log('Real-time update received:', payload.eventType);
                loadIncidents();
            }
        )
        .subscribe();
    
    setTimeout(() => {
        isInitialLoad = false;
    }, 3000);
}

function getReportsToDisplay() {
    if (!currentStudent) return [];
    if (viewMode === 'my') {
        return allIncidents.filter(inc => String(inc.student_id) === String(currentStudent?.studentId));
    } else {
        return allIncidents;
    }
}

function getFilteredReports() {
    let reports = getReportsToDisplay();
    if (currentFilter !== 'all') {
        reports = reports.filter(r => r.category === currentFilter);
    }
    return reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function loadAndDisplayReports() {
    const filtered = getFilteredReports();
    displayIncidents(filtered);
    updateStats();
}

function displayIncidents(reports) {
    const container = document.getElementById('incidentsContainer');
    if (!container) return;
    
    const incidentsCount = document.getElementById('incidentsCount');
    if (incidentsCount) {
        incidentsCount.textContent = `${reports.length} ${reports.length === 1 ? 'report' : 'reports'}`;
    }
    
    if (reports.length === 0) {
        let emptyMessage = '';
        if (viewMode === 'my') {
            emptyMessage = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <div class="empty-title">${t('no_reports_yet')}</div>
                    <div class="empty-sub">${t('click_new_report')}</div>
                </div>
            `;
        } else {
            emptyMessage = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <div class="empty-title">${t('no_incidents_reported')}</div>
                    <div class="empty-sub">${t('be_first_to_report')}</div>
                </div>
            `;
        }
        container.innerHTML = emptyMessage;
        return;
    }
    
    container.innerHTML = reports.map(report => createIncidentCard(report)).join('');
}

function createIncidentCard(report) {
    const categoryColors = {
        security: { bg: '#FEF2F2', color: '#DC2626', label: t('security_cat') },
        maintenance: { bg: '#EFF6FF', color: '#2563EB', label: t('maintenance_cat') },
        janitorial: { bg: '#E1F5EE', color: '#085041', label: t('janitorial_cat') },
        facilities: { bg: '#FFFBEB', color: '#D97706', label: t('facilities_cat') }
    };
    
    const priorityColors = {
        high: { bg: '#FEF2F2', color: '#DC2626', label: t('high') },
        medium: { bg: '#FFFBEB', color: '#D97706', label: t('medium') },
        low: { bg: '#F0FDF4', color: '#16A34A', label: t('low') }
    };
    
    const statusColors = {
        pending: { bg: '#FFF7ED', color: '#EA580C', label: t('pending') },
        'in-progress': { bg: '#EFF6FF', color: '#2563EB', label: t('in_progress') },
        resolved: { bg: '#F0FDF4', color: '#16A34A', label: t('resolved') }
    };
    
    const cat = categoryColors[report.category] || categoryColors.maintenance;
    const pri = priorityColors[report.priority] || priorityColors.medium;
    const stat = statusColors[report.status] || statusColors.pending;
    
    const timeAgo = getTimeAgo(new Date(report.timestamp));
    const isYourReport = currentStudent ? String(report.student_id) === String(currentStudent?.studentId) : false;
    const canSeeDetails = canStudentSeeDescription(report);
    const safeTitle = getSafeTitle(report);
    const safeLocation = getSafeLocation(report);
    const safeReporterName = getSafeReporterName(report, isYourReport);
    
    let statusClass = '';
    if (report.status === 'pending') statusClass = 'pending';
    else if (report.status === 'in-progress') statusClass = 'progress';
    else if (report.status === 'resolved') statusClass = 'resolved';
    
    const safetyBadge = (!canSeeDetails && !isYourReport) ? 
        `<span class="badge safety">🔒 ${t('restricted')}</span>` : '';
    
    const isSecurity = isSecuritySensitive(report);
    const securityBadge = isSecurity && !isYourReport ? 
        `<span class="badge security-alert">⚠️ SECURITY CONCERN</span>` : '';
    
    return `
        <div class="incident-card" onclick="viewIncident(${report.id})">
            <div class="card-header">
                <div class="incident-title">${escapeHtml(safeTitle)}</div>
                <div class="incident-badges">
                    <span class="badge ${report.category}">${cat.label}</span>
                    <span class="badge ${report.priority}">${pri.label}</span>
                    <span class="badge ${statusClass}">${stat.label}</span>
                    ${isYourReport ? `<span class="badge your">${t('your_report')}</span>` : `<span class="badge other">${t('by')}: ${escapeHtml(safeReporterName)}</span>`}
                    ${safetyBadge}
                    ${securityBadge}
                </div>
            </div>
            <div class="incident-location">${safeLocation}</div>
            <div class="card-footer">
                <div class="reporter-info">
                    ${!canSeeDetails && !isYourReport ? 
                        (isSecurity ? '🔒 SECURITY REPORT - Identity Protected' : t('sensitive_report')) : 
                        `👤 ${isYourReport ? t('reported_by_you') : `${t('reported_by')}: ${escapeHtml(safeReporterName)}`}`}
                </div>
                <div class="timestamp">${timeAgo}</div>
            </div>
        </div>
    `;
}

// ========== UPDATE STATS ==========
function updateStats() {
    if (!currentStudent) {
        console.log('No current student, skipping stats update');
        return;
    }
    
    const myReports = allIncidents.filter(inc => String(inc.student_id) === String(currentStudent.studentId));
    
    const total = myReports.length;
    const inProgressCount = myReports.filter(r => r.status === 'in-progress').length;
    const pendingCount = myReports.filter(r => r.status === 'pending').length;
    const resolvedCount = myReports.filter(r => r.status === 'resolved').length;
    const totalCampus = allIncidents.length;
    
    const yourReportsEl = document.getElementById('yourReportsCount');
    const inProgressEl = document.getElementById('inProgressCount');
    const resolvedEl = document.getElementById('resolvedCount');
    const totalReportsEl = document.getElementById('totalReportsCount');
    
    if (yourReportsEl) yourReportsEl.textContent = total;
    if (inProgressEl) inProgressEl.textContent = inProgressCount;
    if (resolvedEl) resolvedEl.textContent = resolvedCount;
    if (totalReportsEl) totalReportsEl.textContent = totalCampus;
    
    console.log(`Stats updated: Total: ${total}, Pending: ${pendingCount}, In Progress: ${inProgressCount}, Resolved: ${resolvedCount}`);
}

function getTimeAgo(date) {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    const mins = Math.floor(diff / 60);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'Just now';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'error' ? '#DC2626' : type === 'warning' ? '#F59E0B' : '#10B981'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        white-space: pre-line;
        max-width: 350px;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function toggleViewMode() {
    viewMode = viewMode === 'all' ? 'my' : 'all';
    const toggleBtn = document.getElementById('viewModeToggle');
    if (toggleBtn) {
        toggleBtn.innerHTML = viewMode === 'my' ? '🌐 ' + t('all_reports') : '📋 ' + t('view_my_reports');
    }
    loadAndDisplayReports();
}

// ========== VIEW INCIDENT MODAL ==========
window.viewIncident = function(id) {
    const inc = allIncidents.find(i => i.id === id);
    if (!inc) return;
    
    let modal = document.getElementById('incidentModal');
    if (!modal) {
        createModal();
        modal = document.getElementById('incidentModal');
    }
    
    const isYourReport = currentStudent ? String(inc.student_id) === String(currentStudent?.studentId) : false;
    const canSeeDetails = canStudentSeeDescription(inc);
    const safeTitle = getSafeTitle(inc);
    const safeLocation = getSafeLocation(inc);
    const safeReporterName = getSafeReporterName(inc, isYourReport);
    const safeDescription = getSafeDescription(inc, isYourReport, canSeeDetails);
    const isSecurity = isSecuritySensitive(inc);
    
    const titleEl = document.getElementById('modalTitle');
    const locationEl = document.getElementById('modalLocation');
    const categoryEl = document.getElementById('modalCategory');
    const priorityEl = document.getElementById('modalPriority');
    const statusEl = document.getElementById('modalStatus');
    const descriptionEl = document.getElementById('modalDescription');
    const dateEl = document.getElementById('modalDate');
    const reporterEl = document.getElementById('modalReporter');
    
    if (titleEl) titleEl.innerText = safeTitle;
    if (locationEl) locationEl.innerHTML = safeLocation;
    if (categoryEl) categoryEl.innerHTML = `<span class="badge ${inc.category}">${t(inc.category + '_cat') || inc.category}</span>`;
    if (priorityEl) priorityEl.innerHTML = `<span class="badge ${inc.priority}">${t(inc.priority) || inc.priority}</span>`;
    
    let statusClass = '';
    let statusLabel = '';
    if (inc.status === 'pending') {
        statusClass = 'pending';
        statusLabel = t('pending');
    } else if (inc.status === 'in-progress') {
        statusClass = 'progress';
        statusLabel = t('in_progress');
    } else {
        statusClass = 'resolved';
        statusLabel = t('resolved');
    }
    if (statusEl) statusEl.innerHTML = `<span class="badge ${statusClass}">${statusLabel}</span>`;
    
    if (descriptionEl) {
        if (isYourReport || canSeeDetails) {
            descriptionEl.innerHTML = `<div style="padding: 8px 0;">${escapeHtml(safeDescription)}</div>`;
        } else {
            if (isSecurity) {
                descriptionEl.innerHTML = `
                    <div style="background: #FEF2F2; padding: 16px; border-radius: 12px; border-left: 4px solid #DC2626;">
                        <strong style="color: #DC2626;">⚠️ SECURITY REPORT ⚠️</strong><br>
                        <span style="color: #475569;">This report contains sensitive security information. For the safety of all parties, details are only available to campus security personnel and the original reporter.</span>
                    </div>
                `;
            } else {
                descriptionEl.innerHTML = `
                    <div style="background: #FEF2F2; padding: 16px; border-radius: 12px; border-left: 4px solid #DC2626;">
                        <strong style="color: #DC2626;">${t('security_restriction')}</strong><br>
                        <span style="color: #475569;">${t('security_message')}</span>
                    </div>
                `;
            }
        }
    }
    
    if (dateEl) dateEl.innerText = new Date(inc.timestamp).toLocaleString();
    
    if (reporterEl) {
        if (!canSeeDetails && !isYourReport) {
            reporterEl.innerHTML = `<span class="badge safety">🔒 ${t('confidential')}</span>`;
        } else {
            reporterEl.innerHTML = `<span class="badge other">${isYourReport ? t('you') : escapeHtml(safeReporterName)}</span>`;
        }
    }
    
    const modalHeader = modal.querySelector('.modal-header h3');
    if (modalHeader) modalHeader.innerHTML = `📋 ${t('incident_details')}`;
    
    const closeBtn = modal.querySelector('.modal-footer .modal-btn');
    if (closeBtn) closeBtn.textContent = t('close');
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.closeModal = function() {
    const modal = document.getElementById('incidentModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
};

function createModal() {
    if (document.getElementById('incidentModal')) return;
    
    const modalHTML = `
        <div id="incidentModal" class="modal-overlay">
            <div class="modal-container">
                <div class="modal-header">
                    <h3>📋 ${t('incident_details')}</h3>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="modal-row"><div class="modal-label">${t('title')}</div><div class="modal-value" id="modalTitle"></div></div>
                    <div class="modal-row"><div class="modal-label">${t('location')}</div><div class="modal-value" id="modalLocation"></div></div>
                    <div class="modal-row"><div class="modal-label">${t('category')}</div><div class="modal-value" id="modalCategory"></div></div>
                    <div class="modal-row"><div class="modal-label">${t('priority')}</div><div class="modal-value" id="modalPriority"></div></div>
                    <div class="modal-row"><div class="modal-label">${t('status')}</div><div class="modal-value" id="modalStatus"></div></div>
                    <div class="modal-row"><div class="modal-label">${t('reported_by')}</div><div class="modal-value" id="modalReporter"></div></div>
                    <div class="modal-row"><div class="modal-label">${t('description')}</div><div class="modal-value" id="modalDescription"></div></div>
                    <div class="modal-row"><div class="modal-label">${t('date')}</div><div class="modal-value" id="modalDate"></div></div>
                </div>
                <div class="modal-footer"><button class="modal-btn modal-btn-primary" onclick="closeModal()">${t('close')}</button></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function getReports() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    return [];
}

function saveReports(reports) {
    console.warn('saveReports() called on student dashboard — write is suppressed to prevent cross-tab loop.');
}

function loadStudentFromLogin() {
    if (!currentStudent) {
        const stored = localStorage.getItem('currentStudent');
        if (stored) {
            try {
                currentStudent = JSON.parse(stored);
            } catch(e) {
                console.error('Failed to parse stored student:', e);
            }
        }
        return;
    }
    
    const studentNameElements = document.querySelectorAll('#studentName, .drawer-name');
    studentNameElements.forEach(el => {
        if (el) {
            el.textContent = currentStudent.name || 'Student';
        }
    });
    
    const studentNumberEl = document.getElementById('studentNumber');
    if (studentNumberEl && currentStudent.studentId) {
        studentNumberEl.textContent = `ID: ${currentStudent.studentId}`;
    } else if (studentNumberEl) {
        studentNumberEl.textContent = 'ID: Not assigned';
    }
    
    const welcomeHeader = document.getElementById('welcomeMessage');
    if (welcomeHeader) {
        const firstName = currentStudent.name ? currentStudent.name.split(' ')[0] : 'Student';
        welcomeHeader.innerHTML = `${t('welcome_back')}, ${firstName}! 👋`;
    }
    
    const currentDateEl = document.getElementById('currentDate');
    if (currentDateEl) {
        currentDateEl.textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }
}

function loadProfileImage() {
    if (!currentStudent) return;
    const savedImage = localStorage.getItem(`avatar_${currentStudent.studentId}`);
    const avatarContainer = document.querySelector('.drawer-avatar');
    if (avatarContainer && savedImage) {
        avatarContainer.innerHTML = `<img src="${savedImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    }
}

function setupAvatarUpload() {
    const avatarContainer = document.querySelector('.drawer-avatar');
    if (!avatarContainer) return;
    
    let fileInput = document.getElementById('avatarUploadInput');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'avatarUploadInput';
        fileInput.accept = 'image/jpeg,image/png,image/jpg';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg')) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    const imageData = ev.target.result;
                    localStorage.setItem(`avatar_${currentStudent.studentId}`, imageData);
                    avatarContainer.innerHTML = `<img src="${imageData}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
                    showNotification(t('profile_updated'));
                };
                reader.readAsDataURL(file);
            } else {
                showNotification(t('invalid_image'), 'error');
            }
            fileInput.value = '';
        });
    }
    
    avatarContainer.style.cursor = 'pointer';
    avatarContainer.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
}

function setupFilters() {
    document.querySelectorAll('.filter-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            loadAndDisplayReports();
        });
    });
}

function addViewModeToggle() {
    const filterBar = document.querySelector('.filter-bar');
    if (filterBar && !document.getElementById('viewModeToggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'viewModeToggle';
        toggleBtn.className = 'filter-chip';
        toggleBtn.style.background = '#2563EB';
        toggleBtn.style.color = 'white';
        toggleBtn.innerHTML = '📋 ' + t('view_my_reports');  
        toggleBtn.onclick = () => toggleViewMode();
        filterBar.appendChild(toggleBtn);
    }
}

function initializeDrawer() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('overlay');
    const hamburger = document.getElementById('hamburger');
    
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
    
    if (hamburger) hamburger.addEventListener('click', window.openDrawer);
    if (overlay) overlay.addEventListener('click', window.closeDrawer);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') window.closeDrawer();
    });
    
    document.querySelectorAll('.drawer-item').forEach(item => {
        item.addEventListener('click', () => {
            window.closeDrawer();
        });
    });
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        
        newLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm(t('confirm_logout'))) {
                localStorage.removeItem('currentStudent');
                showNotification(t('logged_out'));
                setTimeout(() => {
                    window.location.href = '/land.html';
                }, 1000);
            }
        });
    }
}

function addDrawerStyles() {
    if (document.getElementById('drawer-styles')) return;
    const style = document.createElement('style');
    style.id = 'drawer-styles';
    style.textContent = `
        .drawer { transition: transform 0.3s ease; }
        .drawer.open { transform: translateX(0); }
        @media (max-width: 768px) {
            .drawer { transform: translateX(-100%); }
        }
        .notification { animation: slideIn 0.3s ease; }
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
        .badge.other { background: #E2E8F0; color: #475569; }
        .badge.safety { background: #FEF2F2; color: #DC2626; font-weight: 500; }
        .badge.security-alert { background: #DC2626; color: white; font-weight: 600; animation: pulse 2s infinite; }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
        }
        .filter-chip.active { background: #2563EB; color: white; }
        #viewModeToggle { transition: all 0.2s ease; }
        .incident-card {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            cursor: pointer;
        }
        .incident-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }
    `;
    document.head.appendChild(style);
}

function setupUI() {
    initializeDrawer();
    addDrawerStyles();
    setupAvatarUpload();
    setupFilters();
    addViewModeToggle();
    loadProfileImage();
    
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            const drawer = document.getElementById('drawer');
            const hamburger = document.getElementById('hamburger');
            if (drawer && !drawer.contains(e.target) && !hamburger?.contains(e.target)) {
                window.closeDrawer();
            }
        }
    });
}

// ========== BOTTOM NAVIGATION ==========
function setupBottomNav() {
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    const drawerItems = document.querySelectorAll('.drawer-item');
    
    function setActiveNav(activePage) {
        bottomNavItems.forEach(item => {
            const itemPage = item.dataset.page;
            if (itemPage === activePage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        drawerItems.forEach(item => {
            const itemPage = item.dataset.page;
            if (itemPage === activePage) {
                item.classList.add('active');
            } else if (itemPage !== 'my-reports' && itemPage !== 'settings') {
                item.classList.remove('active');
            }
        });
    }
    
    bottomNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const page = item.dataset.page;
            
            if (page === 'dashboard') {
                window.location.href = '/Assets/Student_dashboard/SDB.html';
            } else if (page === 'report') {
                const storedStudent = localStorage.getItem('currentStudent');
                if (storedStudent) {
                    localStorage.setItem('currentStudent', storedStudent);
                }
                window.location.href = '/Assets/Student_reporting/report.html';
            } else if (page === 'settings') {
                window.location.href = '/Assets/Student_dashboard/setting/setting.html';
            }
        });
    });
    
    const currentPath = window.location.pathname;
    if (currentPath.includes('SDB.html') || currentPath.includes('dashboard')) {
        setActiveNav('dashboard');
    } else if (currentPath.includes('report.html')) {
        setActiveNav('report');
    } else if (currentPath.includes('setting.html')) {
        setActiveNav('settings');
    }
}

// ========== PAGE TRANSITION ANIMATIONS ==========
function createLoader() {
    if (document.getElementById('pageLoader')) return;
    
    const loader = document.createElement('div');
    loader.id = 'pageLoader';
    loader.className = 'page-transition-loader';
    loader.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loader);
    return loader;
}

function createRippleEffect(event, element) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    element.appendChild(ripple);
    
    setTimeout(() => {
        if (ripple && ripple.remove) ripple.remove();
    }, 500);
}

function navigateWithAnimation(targetUrl) {
    const mainContent = document.querySelector('.main-content');
    const loader = document.getElementById('pageLoader') || createLoader();
    
    if (mainContent) {
        mainContent.classList.add('fade-out');
        mainContent.classList.remove('fade-in');
    }
    
    if (loader) {
        setTimeout(() => {
            loader.classList.add('show');
        }, 100);
    }
    
    setTimeout(() => {
        window.location.href = targetUrl;
    }, 280);
}

function setupBeautifulBottomNav() {
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    const currentPath = window.location.pathname;
    
    const pageUrls = {
        'dashboard': '/Assets/Student_dashboard/SDB.html',
        'report': '/Assets/Student_reporting/report.html',
        'settings': '/Assets/Student_dashboard/setting/setting.html'
    };
    
    function getCurrentPageKey() {
        if (currentPath.includes('SDB.html') || currentPath.includes('dashboard')) {
            return 'dashboard';
        } else if (currentPath.includes('report.html')) {
            return 'report';
        } else if (currentPath.includes('setting.html')) {
            return 'settings';
        }
        return 'dashboard';
    }
    
    const currentPage = getCurrentPageKey();
    
    bottomNavItems.forEach(item => {
        const pageKey = item.dataset.page;
        if (pageKey === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    bottomNavItems.forEach(item => {
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        newItem.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const targetPage = newItem.dataset.page;
            const targetUrl = pageUrls[targetPage];
            const currentPageKey = getCurrentPageKey();
            
            if (targetPage === currentPageKey) {
                createRippleEffect(e, newItem);
                return;
            }
            
            createRippleEffect(e, newItem);
            
            const storedStudent = localStorage.getItem('currentStudent');
            if (storedStudent) {
                localStorage.setItem('currentStudent', storedStudent);
            }
            
            navigateWithAnimation(targetUrl);
        });
    });
}

function fadeInMainContentBeautiful() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    mainContent.classList.remove('fade-out');
    mainContent.classList.add('fade-in');
    
    setTimeout(() => {
        mainContent.classList.remove('fade-in');
    }, 400);
}

function hideLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) {
        loader.classList.remove('show');
    }
}

function initBeautifulAnimations() {
    createLoader();
    
    setTimeout(() => {
        fadeInMainContentBeautiful();
        setupBeautifulBottomNav();
        hideLoader();
    }, 50);
}

function setupReportButtonBeautiful() {
    const reportBtn = document.querySelector('.bottom-nav-item[data-page="report"]');
    if (!reportBtn) return;
    
    reportBtn.addEventListener('click', (e) => {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const rect = reportBtn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        reportBtn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 500);
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) mainContent.classList.add('fade-out');
        
        const loader = document.getElementById('pageLoader');
        if (loader) setTimeout(() => loader.classList.add('show'), 100);
        
        const storedStudent = localStorage.getItem('currentStudent');
        if (storedStudent) localStorage.setItem('currentStudent', storedStudent);
        
        setTimeout(() => {
            window.location.href = '/Assets/Student_reporting/report.html';
        }, 280);
    });
}

// ========== CROSS-TAB SYNC FOR PROFILE UPDATES ==========
function setupCrossTabSync() {
    window.addEventListener('storage', (e) => {
        if (e.key === 'student_data_updated') {
            console.log('Student data updated in another tab, refreshing...');
            refreshStudentData();
        }
    });
    
    window.addEventListener('message', (event) => {
        if (event.data.type === 'STUDENT_UPDATE' && event.data.student) {
            console.log('Received student update from settings page');
            currentStudent = event.data.student;
            updateDashboardUI(currentStudent);
            showNotification('Profile updated successfully!', 'success');
        }
    });
    
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            console.log('Tab became active, checking for updates...');
            refreshStudentData();
        }
    });
    
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            console.log('Page restored from bfcache, refreshing...');
            refreshStudentData();
        }
    });
}

async function refreshStudentData() {
    const stored = localStorage.getItem('currentStudent');
    if (stored) {
        try {
            const parsedStudent = JSON.parse(stored);
            if (currentStudent && parsedStudent.name !== currentStudent.name) {
                currentStudent = parsedStudent;
                updateDashboardUI(currentStudent);
                await loadIncidents();
                updateStats();
                showNotification('Profile updated!', 'success');
            }
        } catch(e) {
            console.error('Error refreshing dashboard data:', e);
        }
    }
}

function updateDashboardUI(student) {
    if (!student) return;
    
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        const firstName = student.name ? student.name.split(' ')[0] : 'Student';
        welcomeMessage.innerHTML = `${t('welcome_back') || 'Welcome back'}, ${firstName}! 👋`;
    }
    
    const drawerName = document.getElementById('studentName');
    if (drawerName) {
        drawerName.textContent = student.name || 'Student';
    }
    
    const studentNumber = document.getElementById('studentNumber');
    if (studentNumber && student.studentId) {
        studentNumber.textContent = `ID: ${student.studentId}`;
    }
    
    document.querySelectorAll('.student-name, .user-name, .drawer-name').forEach(el => {
        el.textContent = student.name || 'Student';
    });
}

// ========== INITIALIZATION ==========
async function init() {
    console.log('Initializing dashboard...');
    
    const authSuccess = await checkAuth();
    console.log('Auth success:', authSuccess);
    
    loadStudentFromLogin();
    loadLanguage();
    await loadIncidents();
    setupUI();
    setupRealtimeSubscription();
    setupNotificationSystem();
    initDarkMode();
    setupBottomNav();
    setupCrossTabSync();
    
    setInterval(() => {
        if (allIncidents.length > 0) {
            checkForUpdates();
        }
    }, 10000);
}

// Initialize animations on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initBeautifulAnimations();
    setupReportButtonBeautiful();
});

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        hideLoader();
        fadeInMainContentBeautiful();
        setupBeautifulBottomNav();
        refreshStudentData();
    }
});

window.addEventListener('load', () => {
    hideLoader();
});

// Export functions
window.getReports = getReports;
window.saveReports = saveReports;
window.viewIncident = viewIncident;
window.closeModal = closeModal;
window.updateWelcomeMessage = function(newName) {
    if (newName && currentStudent) {
        currentStudent.name = newName;
        const firstName = newName.split(' ')[0];
        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage) {
            welcomeMessage.innerHTML = `${t('welcome_back') || 'Welcome back'}, ${firstName}! 👋`;
        }
        const drawerName = document.getElementById('studentName');
        if (drawerName) drawerName.textContent = newName;
        document.querySelectorAll('#studentName, .drawer-name').forEach(el => {
            if (el) el.textContent = newName;
        });
    }
};

// Start the dashboard
init();