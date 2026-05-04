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

// Sensitive categories
const SENSITIVE_CATEGORIES = ['weapon', 'violence', 'threat', 'danger', 'security', 'harassment', 'bullying'];

// ========== NOTIFICATION SYSTEM ==========
let notifications = [];
let unreadCount = 0;

// Load notifications from localStorage
function loadNotifications() {
    const saved = localStorage.getItem('student_notifications');
    if (saved) {
        notifications = JSON.parse(saved);
        updateNotificationBadge();
    }
}

// Save notifications to localStorage
function saveNotifications() {
    localStorage.setItem('student_notifications', JSON.stringify(notifications));
}

// Add new notification
function addNotification(title, message, type = 'info') {
    const notification = {
        id: Date.now(),
        title: title,
        message: message,
        type: type,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    notifications.unshift(notification);
    saveNotifications();
    updateNotificationBadge();
    
    // Show toast notification
    showNotificationToast(title, message);
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
        notifications = notifications.slice(0, 50);
        saveNotifications();
    }
}

// Update notification badge count
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

// Show toast notification
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

// Render notification panel
function renderNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    const list = document.getElementById('notificationList');
    
    if (!panel || !list) return;
    
    if (notifications.length === 0) {
        list.innerHTML = `
            <div class="notification-empty">
                <div>🔔</div>
                <p>No notifications yet</p>
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
    
    // Add click handlers for notifications
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.dataset.id);
            markNotificationAsRead(id);
        });
    });
}

// Mark notification as read
function markNotificationAsRead(id) {
    const notif = notifications.find(n => n.id === id);
    if (notif && !notif.read) {
        notif.read = true;
        saveNotifications();
        updateNotificationBadge();
        renderNotificationPanel();
    }
}

// Clear all notifications
function clearAllNotifications() {
    if (confirm('Clear all notifications?')) {
        notifications = [];
        saveNotifications();
        updateNotificationBadge();
        renderNotificationPanel();
        showNotification('All notifications cleared');
    }
}

// Create notification panel in DOM
function createNotificationPanel() {
    if (document.getElementById('notificationPanel')) return;
    
    const panelHTML = `
        <div id="notificationPanel" class="notification-panel">
            <div class="notification-header">
                <h4>🔔 Notifications</h4>
                <button class="notification-clear" id="clearNotificationsBtn">Clear all</button>
            </div>
            <div id="notificationList" class="notification-list"></div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', panelHTML);
    
    // Setup clear button
    const clearBtn = document.getElementById('clearNotificationsBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllNotifications);
    }
    
    renderNotificationPanel();
}

// Setup notification button
function setupNotificationSystem() {
    createNotificationPanel();
    loadNotifications();
    
    const notifBtn = document.getElementById('notificationBtn');
    const panel = document.getElementById('notificationPanel');
    
    if (notifBtn) {
        // Remove existing listeners
        const newNotifBtn = notifBtn.cloneNode(true);
        notifBtn.parentNode.replaceChild(newNotifBtn, notifBtn);
        
        newNotifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.classList.toggle('active');
            renderNotificationPanel();
        });
    }
    
    // Close panel when clicking outside
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
    
    // Check for saved dark mode preference
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedMode === 'enabled' || (!savedMode && prefersDark)) {
        enableDarkMode();
    } else {
        disableDarkMode();
    }
    
    // Setup toggle button
    const toggleBtn = document.getElementById('darkModeToggle');
    if (toggleBtn) {
        // Remove existing listeners
        const newToggleBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
        
        newToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleDarkMode();
        });
        console.log('Dark mode button setup complete');
    } else {
        console.log('Dark mode toggle button not found');
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
    showNotification('Dark mode enabled 🌙', 'success');
}

function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', 'disabled');
    updateDarkModeIcons(false);
    showNotification('Light mode enabled ☀️', 'success');
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

// ========== AUTO-NOTIFICATIONS FOR REPORT UPDATES ==========
let lastIncidentCount = 0;
let lastStatusUpdates = {};

function checkForUpdates() {
    if (!currentStudent) return;
    
    // Check for status changes in student's reports
    const myReports = allIncidents.filter(inc => 
        String(inc.student_id) === String(currentStudent?.studentId)
    );
    
    // Check if new reports added
    if (myReports.length > lastIncidentCount && lastIncidentCount !== 0) {
        const newCount = myReports.length - lastIncidentCount;
        addNotification(
            'New Report Update',
            `${newCount} new ${newCount === 1 ? 'report has' : 'reports have'} been added to your reports`,
            'info'
        );
    }
    
    // Check for status changes in student's reports
    myReports.forEach(report => {
        const lastStatus = lastStatusUpdates[report.id];
        if (lastStatus && lastStatus !== report.status) {
            let statusMessage = '';
            if (report.status === 'in-progress') {
                statusMessage = 'Your report is now being processed';
            } else if (report.status === 'resolved') {
                statusMessage = 'Your report has been resolved!';
            } else if (report.status === 'pending') {
                statusMessage = 'Your report is pending review';
            }
            
            if (statusMessage) {
                addNotification(
                    `Report Status Update: ${report.name.substring(0, 40)}`,
                    statusMessage,
                    report.status === 'resolved' ? 'success' : 'info'
                );
            }
        }
        lastStatusUpdates[report.id] = report.status;
    });
    
    lastIncidentCount = myReports.length;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    init();
    startAutoRefresh();
});

function startAutoRefresh() {
    console.log('Auto-refresh is disabled');
    return;
}

window.addEventListener('beforeunload', () => {
    if (refreshInterval) clearInterval(refreshInterval);
    if (realtimeSubscription) realtimeSubscription.unsubscribe();
});

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
                    <div class="empty-title">No reports yet</div>
                    <div class="empty-sub">Click the "New Report" button to submit your first incident report</div>
                </div>
            `;
        } else {
            emptyMessage = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <div class="empty-title">No incidents reported yet</div>
                    <div class="empty-sub">Be the first to report an incident!</div>
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
        security: { bg: '#FEF2F2', color: '#DC2626', label: 'Security' },
        maintenance: { bg: '#EFF6FF', color: '#2563EB', label: 'Maintenance' },
        janitorial: { bg: '#E1F5EE', color: '#085041', label: 'Janitorial' },
        facilities: { bg: '#FFFBEB', color: '#D97706', label: 'Facilities' }
    };
    
    const priorityColors = {
        high: { bg: '#FEF2F2', color: '#DC2626', label: 'High' },
        medium: { bg: '#FFFBEB', color: '#D97706', label: 'Medium' },
        low: { bg: '#F0FDF4', color: '#16A34A', label: 'Low' }
    };
    
    const statusColors = {
        pending: { bg: '#FFF7ED', color: '#EA580C', label: 'Pending' },
        'in-progress': { bg: '#EFF6FF', color: '#2563EB', label: 'In Progress' },
        resolved: { bg: '#F0FDF4', color: '#16A34A', label: 'Resolved' }
    };
    
    const cat = categoryColors[report.category] || categoryColors.maintenance;
    const pri = priorityColors[report.priority] || priorityColors.medium;
    const stat = statusColors[report.status] || statusColors.pending;
    
    const timeAgo = getTimeAgo(new Date(report.timestamp));
    const isYourReport = currentStudent ? String(report.student_id) === String(currentStudent?.studentId) : false;
    const canSeeDetails = canStudentSeeDescription(report);
    const safeTitle = getSafeTitle(report);
    const safeLocation = getSafeLocation(report);
    
    let statusClass = '';
    if (report.status === 'pending') statusClass = 'pending';
    else if (report.status === 'in-progress') statusClass = 'progress';
    else if (report.status === 'resolved') statusClass = 'resolved';
    
    const safetyBadge = (!canSeeDetails && !isYourReport) ? 
        '<span class="badge safety">🔒 Restricted</span>' : '';
    
    const reporterDisplay = report.is_anonymous === 'true' ? 'Anonymous Reporter' : (report.reporter || 'Student');
    
    return `
        <div class="incident-card" onclick="viewIncident(${report.id})">
            <div class="card-header">
                <div class="incident-title">${escapeHtml(safeTitle)}</div>
                <div class="incident-badges">
                    <span class="badge ${report.category}">${cat.label}</span>
                    <span class="badge ${report.priority}">${pri.label}</span>
                    <span class="badge ${statusClass}">${stat.label}</span>
                    ${isYourReport ? '<span class="badge your">Your Report</span>' : '<span class="badge other">By: ' + escapeHtml(reporterDisplay) + '</span>'}
                    ${safetyBadge}
                </div>
            </div>
            <div class="incident-location">${safeLocation}</div>
            <div class="card-footer">
                <div class="reporter-info">
                    ${!canSeeDetails && !isYourReport ? 
                        '🔒 Sensitive report - details restricted to security personnel' : 
                        `👤 ${isYourReport ? 'Reported by you' : `Reported by: ${escapeHtml(reporterDisplay)}`}`}
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
    const inProgressCount = myReports.filter(r => r.status === 'in-progress' || r.status === 'pending').length;
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
        toggleBtn.textContent = viewMode === 'my' ? '🌐 View All Reports' : '📋 View My Reports';
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
    
    document.getElementById('modalTitle').innerText = safeTitle;
    document.getElementById('modalLocation').innerHTML = safeLocation;
    document.getElementById('modalCategory').innerHTML = `<span class="badge ${inc.category}">${inc.category}</span>`;
    document.getElementById('modalPriority').innerHTML = `<span class="badge ${inc.priority}">${inc.priority}</span>`;
    
    let statusClass = '';
    let statusLabel = '';
    if (inc.status === 'pending') {
        statusClass = 'pending';
        statusLabel = 'Pending';
    } else if (inc.status === 'in-progress') {
        statusClass = 'progress';
        statusLabel = 'In Progress';
    } else {
        statusClass = 'resolved';
        statusLabel = 'Resolved';
    }
    document.getElementById('modalStatus').innerHTML = `<span class="badge ${statusClass}">${statusLabel}</span>`;
    
    const descriptionElement = document.getElementById('modalDescription');
    if (isYourReport || canSeeDetails) {
        descriptionElement.innerHTML = `<div style="padding: 8px 0;">${escapeHtml(inc.description || 'No description provided')}</div>`;
    } else {
        descriptionElement.innerHTML = `
            <div style="background: #FEF2F2; padding: 16px; border-radius: 12px; border-left: 4px solid #DC2626;">
                <strong style="color: #DC2626;">⚠️ Security Restriction</strong><br>
                <span style="color: #475569;">This report contains sensitive safety information. Campus security has been notified and is handling the situation.</span>
            </div>
        `;
    }
    
    document.getElementById('modalDate').innerText = new Date(inc.timestamp).toLocaleString();
    
    const modalReporter = document.getElementById('modalReporter');
    if (modalReporter) {
        const reporterDisplay = inc.is_anonymous === 'true' ? 'Anonymous Reporter' : (inc.reporter || 'Another Student');
        if (!canSeeDetails && !isYourReport) {
            modalReporter.innerHTML = `<span class="badge safety">🔒 Confidential - Restricted Access</span>`;
        } else {
            modalReporter.innerHTML = `<span class="badge other">${isYourReport ? 'You' : escapeHtml(reporterDisplay)}</span>`;
        }
    }
    
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
                    <h3>📋 Incident Details</h3>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="modal-row"><div class="modal-label">Title</div><div class="modal-value" id="modalTitle"></div></div>
                    <div class="modal-row"><div class="modal-label">Location</div><div class="modal-value" id="modalLocation"></div></div>
                    <div class="modal-row"><div class="modal-label">Category</div><div class="modal-value" id="modalCategory"></div></div>
                    <div class="modal-row"><div class="modal-label">Priority</div><div class="modal-value" id="modalPriority"></div></div>
                    <div class="modal-row"><div class="modal-label">Status</div><div class="modal-value" id="modalStatus"></div></div>
                    <div class="modal-row"><div class="modal-label">Reported By</div><div class="modal-value" id="modalReporter"></div></div>
                    <div class="modal-row"><div class="modal-label">Description</div><div class="modal-value" id="modalDescription"></div></div>
                    <div class="modal-row"><div class="modal-label">Date</div><div class="modal-value" id="modalDate"></div></div>
                </div>
                <div class="modal-footer"><button class="modal-btn modal-btn-primary" onclick="closeModal()">Close</button></div>
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
    
    // Update student name
    const studentNameElements = document.querySelectorAll('#studentName, .drawer-name');
    studentNameElements.forEach(el => {
        if (el) {
            el.textContent = currentStudent.name || 'Student';
        }
    });
    
    // FIXED: Display student number in drawer
    const studentNumberEl = document.getElementById('studentNumber');
    if (studentNumberEl && currentStudent.studentId) {
        studentNumberEl.textContent = `ID: ${currentStudent.studentId}`;
    } else if (studentNumberEl) {
        studentNumberEl.textContent = 'ID: Not assigned';
    }
    
    // Update welcome message
    const welcomeHeader = document.getElementById('welcomeMessage');
    if (welcomeHeader) {
        const firstName = currentStudent.name ? currentStudent.name.split(' ')[0] : 'Student';
        welcomeHeader.innerHTML = `Welcome back, ${firstName}! 👋`;
    }
    
    // Update date
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
                    showNotification('Profile picture updated successfully!');
                };
                reader.readAsDataURL(file);
            } else {
                showNotification('Please select a valid image file (JPEG, PNG)', 'error');
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

// FIXED: Changed initial button text to match viewMode = 'all'
function addViewModeToggle() {
    const filterBar = document.querySelector('.filter-bar');
    if (filterBar && !document.getElementById('viewModeToggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'viewModeToggle';
        toggleBtn.className = 'filter-chip';
        toggleBtn.style.background = '#2563EB';
        toggleBtn.style.color = 'white';
        toggleBtn.innerHTML = '📋 View My Reports';  
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

// Setup bottom navigation
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
    
    // Determine which nav is active based on URL
    const currentPath = window.location.pathname;
    if (currentPath.includes('SDB.html') || currentPath.includes('dashboard')) {
        setActiveNav('dashboard');
    } else if (currentPath.includes('report.html')) {
        setActiveNav('report');
    } else if (currentPath.includes('setting.html')) {
        setActiveNav('settings');
    }
}

// ========== INITIALIZATION ==========
async function init() {
    console.log('Initializing dashboard...');
    
    const authSuccess = await checkAuth();
    console.log('Auth success:', authSuccess);
    
    loadStudentFromLogin();
    await loadIncidents();
    setupUI();
    setupRealtimeSubscription();
    setupNotificationSystem();
    initDarkMode();
    setupBottomNav();
    
    // Auto-check for updates every 10 seconds
    setInterval(() => {
        if (allIncidents.length > 0) {
            checkForUpdates();
        }
    }, 10000);
}

// Export functions
window.getReports = getReports;
window.saveReports = saveReports;
window.viewIncident = viewIncident;
window.closeModal = closeModal;