import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

let incidents = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentAdmin = null;
let currentIncidentId = null;
let realtimeSubscription = null;

// ========== GLOBAL FUNCTIONS FOR HTML ONCLICK ==========
window.openModal = null;
window.closeModal = null;
window.saveStatus = null;
window.deleteIncident = null;
window.exportToCSV = null;

// ========== NOTIFICATION SYSTEM (FIXED FOR MOBILE/TABLET) ==========
let notifications = [];
let notificationIdCounter = 0;
let isNotificationDropdownOpen = false;
let _closeDropdownHandler = null;
let lastUrgentTime = 0;

// Detect if device is mobile/tablet
function isMobileOrTablet() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Tablet|iPad|Android(?!.*Mobile)/i.test(navigator.userAgent) || 
           window.innerWidth <= 1024;
}

// Load notifications
function loadNotifications() {
    const stored = localStorage.getItem('admin_notifications');
    if (stored) {
        try {
            notifications = JSON.parse(stored);
            notificationIdCounter = notifications.length > 0
                ? Math.max(...notifications.map(n => n.id)) + 1
                : 0;
        } catch (e) {
            notifications = [];
            notificationIdCounter = 0;
        }
    } else {
        notifications = [];
    }

    _ensureDropdownExists();
    updateNotificationBadge();
    updateNotificationDropdown();
}

function saveNotifications() {
    localStorage.setItem('admin_notifications', JSON.stringify(notifications));
    if (document.getElementById('notificationBadge')) {
        updateNotificationBadge();
    }
}

// Request notification permission (won't break on mobile/tablet)
async function requestNotificationPermission() {
    if ('Notification' in window) {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('✅ Notification permission granted');
                if (!isMobileOrTablet()) {
                    new Notification('Campus Care Admin', {
                        body: 'Notifications enabled! You will receive alerts for new incidents.',
                        icon: '/Assets/Images/logo.png'
                    });
                }
            } else {
                console.log('❌ Notification permission denied');
            }
        } catch (error) {
            console.log('Notification permission error:', error);
        }
    }
}

// Safe browser notification (won't throw errors)
function sendBrowserNotification(title, body, isUrgent = false) {
    if (!('Notification' in window)) {
        return;
    }
    
    if (Notification.permission !== 'granted') {
        return;
    }
    
    // Skip on mobile/tablet to avoid iOS issues
    if (isMobileOrTablet()) {
        console.log('Skipping browser notification on mobile/tablet, using fallback instead');
        return;
    }
    
    try {
        if (isUrgent) {
            const now = Date.now();
            if (now - lastUrgentTime < 10000) {
                return;
            }
            lastUrgentTime = now;
        }
        
        const notificationOptions = {
            body: isUrgent ? `🚨 URGENT: ${body}` : body,
            icon: '/Assets/Images/logo.png',
            badge: '/Assets/Images/logo.png',
            vibrate: isUrgent ? [200, 100, 200, 100, 200] : [100, 50, 100],
            silent: false,
            requireInteraction: isUrgent && !isMobileOrTablet(),
            tag: `incident-${Date.now()}`,
            renotify: true
        };
        
        const notification = new Notification(title, notificationOptions);
        
        notification.onclick = function() {
            window.focus();
            notification.close();
        };
        
        setTimeout(() => notification.close(), isUrgent ? 30000 : 10000);
    } catch (error) {
        console.log('Browser notification error:', error);
    }
}

// Mobile fallback notification (visible banner)
function showMobileFallbackNotification(title, message, isUrgent = false) {
    const notificationDiv = document.createElement('div');
    notificationDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: ${isUrgent ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)' : 'linear-gradient(135deg, #1D9E75 0%, #085041 100%)'};
        color: white;
        padding: 16px;
        z-index: 10001;
        animation: slideDown 0.3s ease;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        cursor: pointer;
    `;
    
    notificationDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 28px;">${isUrgent ? '🚨' : '📋'}</span>
            <div style="flex: 1;">
                <div style="font-weight: bold; margin-bottom: 4px;">${title}</div>
                <div style="font-size: 13px;">${message}</div>
            </div>
            <button style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px;">View</button>
        </div>
    `;
    
    notificationDiv.onclick = () => {
        notificationDiv.remove();
        window.focus();
    };
    
    document.body.appendChild(notificationDiv);
    setTimeout(() => notificationDiv.remove(), 8000);
    
    if (isUrgent && navigator.vibrate) {
        navigator.vibrate([500, 200, 500]);
    }
}

// Add internal notification (FIXED - no constructor errors)
function addInternalNotification(title, message, isUrgent = false) {
    // Deduplicate
    const now = Date.now();
    const isDuplicate = notifications.some(n =>
        !n.read &&
        n.title === title &&
        n.message === message &&
        (now - new Date(n.timestamp).getTime()) < 3000
    );
    if (isDuplicate) return;

    const notification = {
        id: notificationIdCounter++,
        title: title,
        message: message,
        timestamp: new Date().toISOString(),
        read: false,
        isUrgent: isUrgent
    };

    notifications.unshift(notification);
    if (notifications.length > 50) notifications = notifications.slice(0, 50);

    saveNotifications();
    updateNotificationBadge();
    updateNotificationDropdown();

    // Show toast
    showToast(message, isUrgent ? 'urgent' : 'info');

    // Send appropriate notification based on device
    if (isMobileOrTablet()) {
        showMobileFallbackNotification(title, message, isUrgent);
    } else {
        sendBrowserNotification(title, message, isUrgent);
    }

    // Animate bell for urgent
    if (isUrgent) {
        const bell = document.getElementById('notificationBell');
        if (bell) {
            bell.classList.add('urgent');
            bell.style.animation = 'bellRing 0.5s ease infinite';
            setTimeout(() => {
                bell.classList.remove('urgent');
                bell.style.animation = '';
            }, 3000);
        }
        
        // Flash title for urgent notifications
        const originalTitle = document.title;
        let count = 0;
        const flashInterval = setInterval(() => {
            document.title = count % 2 === 0 ? `🚨 URGENT — ${originalTitle}` : originalTitle;
            if (++count > 10) {
                clearInterval(flashInterval);
                document.title = originalTitle;
            }
        }, 500);
        
        // Vibrate on mobile devices
        if (isMobileOrTablet() && navigator.vibrate) {
            navigator.vibrate([500, 200, 500, 200, 1000]);
        }
    }
    
    console.log('✅ Notification added:', title, message);
}

// Dropdown management
function _ensureDropdownExists() {
    if (document.getElementById('notificationDropdown')) return;
    const dropdown = document.createElement('div');
    dropdown.id = 'notificationDropdown';
    dropdown.className = 'notification-dropdown';
    document.body.appendChild(dropdown);
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;

    const unread = notifications.filter(n => !n.read).length;
    const urgent = notifications.filter(n => !n.read && n.isUrgent).length;

    if (unread > 0) {
        badge.textContent = urgent > 0 ? `🔥${unread}` : (unread > 9 ? '9+' : String(unread));
        badge.style.display = 'flex';
        badge.style.background = urgent > 0 ? '#DC2626' : 'var(--red)';
        badge.style.animation = urgent > 0 ? 'pulse 0.5s ease infinite' : 'none';
    } else {
        badge.style.display = 'none';
    }
}

function updateNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) return;

    const unread = notifications.filter(n => !n.read).length;

    if (!notifications.length) {
        dropdown.innerHTML = `
            <div class="notification-dropdown-header">
                <span>🔔 Notifications</span>
                <button class="clear-all-dropdown" onclick="window.clearAllNotifications()">Clear all</button>
            </div>
            <div class="notification-dropdown-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <p>No notifications yet</p>
                <p style="font-size:11px;margin-top:4px;">New incident reports will appear here</p>
            </div>`;
        return;
    }

    dropdown.innerHTML = `
        <div class="notification-dropdown-header">
            <span>🔔 Notifications${unread > 0 ? ` (${unread})` : ''}</span>
            <button class="clear-all-dropdown" onclick="window.clearAllNotifications()">Clear all</button>
        </div>
        <div class="notification-dropdown-list">
            ${notifications.slice(0, 15).map(notif => `
                <div class="notification-dropdown-item ${!notif.read ? 'unread' : ''} ${notif.isUrgent ? 'urgent' : ''}"
                     onclick="window.markNotificationRead(${notif.id})">
                    <div class="notification-dropdown-title">
                        ${notif.isUrgent ? '🚨 ' : '📋 '}${escapeHtml(notif.title)}
                    </div>
                    <div class="notification-dropdown-message">${escapeHtml(notif.message)}</div>
                    <div class="notification-dropdown-time">${getTimeAgo(new Date(notif.timestamp))}</div>
                </div>`).join('')}
        </div>
        ${notifications.length > 15
            ? `<div class="notification-dropdown-footer">${notifications.length - 15} more notifications</div>`
            : ''}`;
}

function toggleNotificationDropdown() {
    _ensureDropdownExists();
    const dropdown = document.getElementById('notificationDropdown');

    if (isNotificationDropdownOpen) {
        _closeDropdown();
        return;
    }

    const bell = document.getElementById('notificationBell');
    if (bell) {
        const rect = bell.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom + 8}px`;
        dropdown.style.right = `${window.innerWidth - rect.right}px`;
        dropdown.style.left = 'auto';
    }

    updateNotificationDropdown();
    dropdown.style.display = 'block';
    dropdown.classList.add('show');
    isNotificationDropdownOpen = true;

    _closeDropdownHandler = (e) => {
        const dd = document.getElementById('notificationDropdown');
        const bl = document.getElementById('notificationBell');
        if (dd && bl && !dd.contains(e.target) && !bl.contains(e.target)) {
            _closeDropdown();
        }
    };
    requestAnimationFrame(() => document.addEventListener('click', _closeDropdownHandler));
}

function _closeDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
        dropdown.style.display = 'none';
    }
    isNotificationDropdownOpen = false;
    if (_closeDropdownHandler) {
        document.removeEventListener('click', _closeDropdownHandler);
        _closeDropdownHandler = null;
    }
}

window.markNotificationRead = function(id) {
    const notif = notifications.find(n => n.id === id);
    if (notif && !notif.read) {
        notif.read = true;
        saveNotifications();
        updateNotificationBadge();
        updateNotificationDropdown();
    }
};

window.clearAllNotifications = function() {
    notifications = [];
    saveNotifications();
    updateNotificationBadge();
    updateNotificationDropdown();
    showToast('All notifications cleared', 'success');
};

function setupNotificationBell() {
    const bell = document.getElementById('notificationBell');
    if (!bell) return;
    bell.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleNotificationDropdown();
    });
}

function checkForUrgentReport(incident) {
    if (!incident) return;
    
    const isUrgent = incident.priority === 'high' || incident.priority === 'urgent' || incident.category === 'security';
    
    addInternalNotification(
        isUrgent ? '🚨 URGENT INCIDENT REPORTED' : '📋 New Incident Reported',
        `${incident.name || incident.title} at ${incident.location} — Priority: ${(incident.priority || 'medium').toUpperCase()}`,
        isUrgent
    );
}

// ========== DARK MODE SYSTEM ==========
function initDarkMode() {
    const savedMode = localStorage.getItem('admin_dark_mode');
    const toggle = document.getElementById('darkModeToggle');

    if (savedMode === 'enabled') {
        document.body.classList.add('dark-mode');
        if (toggle) {
            const sunIcon = toggle.querySelector('.sun-icon');
            const moonIcon = toggle.querySelector('.moon-icon');
            if (sunIcon) sunIcon.style.display = 'none';
            if (moonIcon) moonIcon.style.display = 'block';
        }
    }

    if (toggle) {
        toggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('admin_dark_mode', isDark ? 'enabled' : 'disabled');
            const sunIcon = toggle.querySelector('.sun-icon');
            const moonIcon = toggle.querySelector('.moon-icon');
            if (sunIcon && moonIcon) {
                sunIcon.style.display = isDark ? 'none' : 'block';
                moonIcon.style.display = isDark ? 'block' : 'none';
            }
        });
    }
}

// ========== LOAD ADMIN PROFILE ==========
function loadAdminProfile() {
    try {
        const storedAdmin = localStorage.getItem('currentAdmin');
        const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
        if (!storedAdmin || isLoggedIn !== 'true') {
            window.location.href = '/Assets/login/admin/admin.html';
            return false;
        }
        currentAdmin = JSON.parse(storedAdmin);
        const adminName = currentAdmin.name || currentAdmin.email;
        const adminInitials = adminName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const drawerName   = document.querySelector('.drawer-name');
        const drawerRole   = document.querySelector('.drawer-role');
        const drawerAvatar = document.querySelector('.drawer-avatar');
        const adminPill    = document.getElementById('adminPill');
        if (drawerName)   drawerName.textContent   = adminName;
        if (drawerRole)   drawerRole.textContent   = currentAdmin.role || 'Campus Care Admin';
        if (adminPill)    adminPill.textContent     = adminName.split(' ')[0] || 'Admin';
        if (drawerAvatar) drawerAvatar.innerHTML    = `<span style="font-size:16px;font-weight:600;color:white;">${adminInitials}</span>`;
        return true;
    } catch (error) {
        console.error('Error loading admin profile:', error);
        return false;
    }
}

// ========== LOAD INCIDENTS FROM SUPABASE ==========
async function loadIncidents() {
    try {
        const { data, error } = await supabase
            .from('incident')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        incidents = (data || []).map(r => ({
            id: r.id,
            name: r.title || 'Untitled',
            location: r.location || 'No location',
            category: r.category || 'maintenance',
            priority: r.priority || 'medium',
            status: r.status || 'pending',
            reporter: r.student_name || 'Student',
            student_id_number: r.student_id_number || 'N/A',
            description: r.description || '',
            timestamp: new Date(r.created_at),
            image_url: r.image_url || null,
            is_anonymous: r.is_anonymous || false,
            resolved_at: r.resolved_at || null
        }));
        renderIncidents();
        updateStats();
    } catch (err) {
        console.error('Error loading incidents:', err);
        loadFromLocalStorage();
    }
}

function loadFromLocalStorage() {
    const stored = localStorage.getItem('campus_care_reports');
    if (stored && stored !== '[]') {
        const reports = JSON.parse(stored);
        incidents = reports.map(r => ({
            id: r.id,
            name: r.title || r.name || 'Untitled',
            location: r.location || 'No location',
            category: r.category || 'maintenance',
            priority: r.priority || 'medium',
            status: r.status || 'pending',
            reporter: r.studentName || r.reporter || 'Student',
            student_id_number: r.studentIdNumber || r.student_id_number || 'N/A',
            description: r.description || '',
            timestamp: new Date(r.timestamp || r.created_at),
            image_url: r.imageUrl || r.image_url || null,
            is_anonymous: r.is_anonymous || false,
            resolved_at: r.resolved_at || null
        }));
    } else {
        incidents = [];
    }
    renderIncidents();
    updateStats();
}

// ========== REAL-TIME SUBSCRIPTION ==========
function setupRealtimeSubscription() {
    if (realtimeSubscription) return;

    console.log('Setting up real-time subscription with notifications...');

    realtimeSubscription = supabase
        .channel('incident-page-changes')
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'incident' },
            async (payload) => {
                console.log('🔔 NEW INCIDENT DETECTED!', payload.new);
                const newIncident = payload.new;
                
                checkForUrgentReport({
                    id: newIncident.id,
                    name: newIncident.title || 'Untitled',
                    title: newIncident.title || 'Untitled',
                    location: newIncident.location || 'campus',
                    priority: newIncident.priority || 'medium',
                    category: newIncident.category || 'maintenance'
                });
                
                await loadIncidents();
            }
        )
        .on('postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'incident' },
            async (payload) => {
                console.log('Incident updated!', payload.new);
                const oldStatus = payload.old?.status;
                const newStatus = payload.new?.status;
                if (oldStatus !== newStatus) {
                    addInternalNotification(
                        `🔄 Status Updated`,
                        `Incident "${payload.new?.title}" status changed from ${oldStatus} to ${newStatus}`,
                        newStatus !== 'resolved'
                    );
                }
                await loadIncidents();
            }
        )
        .on('postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'incident' },
            async () => {
                console.log('Incident deleted!');
                addInternalNotification(
                    `🗑️ Incident Deleted`,
                    `An incident has been removed from the system`,
                    false
                );
                await loadIncidents();
            }
        )
        .subscribe((status) => {
            console.log('Realtime subscription status:', status);
            if (status === 'SUBSCRIBED') {
                console.log('%c✅ REAL-TIME ACTIVE!', 'color: green; font-size: 14px; font-weight: bold');
            }
        });
}

// ========== STATS ==========
function updateStats() {
    const total      = incidents.length;
    const pending    = incidents.filter(i => i.status === 'pending').length;
    const inProgress = incidents.filter(i => i.status === 'in-progress').length;
    const resolved   = incidents.filter(i => i.status === 'resolved').length;

    const totalEl      = document.getElementById('totalIncidents');
    const pendingEl    = document.getElementById('pendingIncidents');
    const inProgressEl = document.getElementById('inProgressIncidents');
    const resolvedEl   = document.getElementById('resolvedIncidents');

    if (totalEl)      totalEl.textContent      = total;
    if (pendingEl)    pendingEl.textContent    = pending;
    if (inProgressEl) inProgressEl.textContent = inProgress;
    if (resolvedEl)   resolvedEl.textContent   = resolved;
}

// ========== FILTERING & RENDERING ==========
function getFilteredIncidents() {
    let filtered = [...incidents];
    const search   = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || 'all';
    const priority = document.getElementById('priorityFilter')?.value || 'all';
    const status   = document.getElementById('statusFilter')?.value || 'all';

    if (search)          filtered = filtered.filter(i => i.name.toLowerCase().includes(search) || i.reporter.toLowerCase().includes(search) || i.location.toLowerCase().includes(search));
    if (category !== 'all') filtered = filtered.filter(i => i.category === category);
    if (priority !== 'all') filtered = filtered.filter(i => i.priority === priority);
    if (status   !== 'all') filtered = filtered.filter(i => i.status   === status);

    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function renderIncidents() {
    const filtered   = getFilteredIncidents();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
    const start     = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);
    renderTable(paginated);
    renderMobileCards(paginated);
    renderPagination(totalPages);
}

function renderTable(list) {
    const tbody = document.getElementById('incidentTableBody');
    if (!tbody) return;
    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:60px;">📭 No incidents found</td></tr>`;
        return;
    }
    tbody.innerHTML = list.map(inc => `
        <tr data-id="${inc.id}">
            <td>
                <div style="display:flex;align-items:center;gap:12px;">
                    <div class="inc-icon-sm" style="background:${getCategoryColor(inc.category)}20;color:${getCategoryColor(inc.category)}">${getCategoryIcon(inc.category)}</div>
                    <div style="flex:1;">
                        <div style="font-weight:700;font-size:14px;color:var(--text);margin-bottom:4px;">${inc.priority === 'high' ? '🚨 ' : ''}${escapeHtml(inc.name)}</div>
                        <div style="font-size:11px;color:var(--muted);">📍 ${escapeHtml(inc.location)}</div>
                    </div>
                </div>
            </td>
            <td><span class="badge" style="background:${getCategoryColor(inc.category)}20;color:${getCategoryColor(inc.category)}">${inc.category.charAt(0).toUpperCase() + inc.category.slice(1)}</span></td>
            <td><span class="badge ${inc.priority === 'high' ? 'b-high' : inc.priority === 'medium' ? 'b-medium' : 'b-low'}">${inc.priority.toUpperCase()}</span></td>
            <td><span class="badge ${inc.status === 'pending' ? 'b-pending' : inc.status === 'in-progress' ? 'b-inprogress' : 'b-resolved'}">${inc.status === 'in-progress' ? 'In Progress' : inc.status}</span></td>
            <td style="color:var(--text);">${escapeHtml(inc.is_anonymous === true ? 'Anonymous' : inc.reporter)}</td>
            <td style="color:var(--text);">${inc.is_anonymous === true ? 'Hidden' : inc.student_id_number}</td>
            <td style="color:var(--muted);">${getTimeAgo(new Date(inc.timestamp))}</td>
            <td>
                <div style="display:flex;gap:8px;">
                    <button class="action-btn" onclick="window.openModal('${inc.id}')" title="View & Edit">👁️</button>
                    <button class="action-btn del" onclick="window.deleteIncident('${inc.id}')" title="Delete">🗑️</button>
                </div>
              </td>
          </tr>
    `).join('');
}

function renderMobileCards(list) {
    const container = document.getElementById('mobileCards');
    if (!container) return;
    if (list.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:40px;">📭 No incidents found</div>`;
        return;
    }
    container.innerHTML = list.map(inc => `
        <div class="m-card">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border);">
                <div class="inc-icon-sm" style="background:${getCategoryColor(inc.category)}20;color:${getCategoryColor(inc.category)}">${getCategoryIcon(inc.category)}</div>
                <div style="flex:1;">
                    <div style="font-weight:700;color:var(--text);margin-bottom:4px;">${inc.priority === 'high' ? '🚨 ' : ''}${escapeHtml(inc.name)}</div>
                    <div style="font-size:11px;color:var(--muted);">📍 ${escapeHtml(inc.location)}</div>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
                <div>
                    <div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--muted);margin-bottom:4px;">Category</div>
                    <span class="badge" style="background:${getCategoryColor(inc.category)}20;color:${getCategoryColor(inc.category)}">${inc.category}</span>
                </div>
                <div>
                    <div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--muted);margin-bottom:4px;">Priority</div>
                    <span class="badge ${inc.priority === 'high' ? 'b-high' : inc.priority === 'medium' ? 'b-medium' : 'b-low'}">${inc.priority}</span>
                </div>
                <div>
                    <div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--muted);margin-bottom:4px;">Status</div>
                    <span class="badge ${inc.status === 'pending' ? 'b-pending' : inc.status === 'in-progress' ? 'b-inprogress' : 'b-resolved'}">${inc.status}</span>
                </div>
                <div>
                    <div style="font-size:10px;font-weight:600;text-transform:uppercase;color:var(--muted);margin-bottom:4px;">Reporter</div>
                    <span style="font-size:12px;color:var(--text);">${escapeHtml(inc.is_anonymous === true ? 'Anonymous' : inc.reporter)}</span>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--border);">
                <div style="font-size:10px;color:var(--hint);">${getTimeAgo(new Date(inc.timestamp))}</div>
                <div style="display:flex;gap:8px;">
                    <button class="action-btn" onclick="window.openModal('${inc.id}')" title="View & Edit">👁️</button>
                    <button class="action-btn del" onclick="window.deleteIncident('${inc.id}')" title="Delete">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderPagination(totalPages) {
    const container = document.getElementById('pagination');
    if (!container) return;
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    let html = `<button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>← Prev</button>`;
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        html += `<button class="page-btn ${currentPage === i ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }
    html += `<button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next →</button>`;
    container.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    renderIncidents();
}

// ========== MODAL FUNCTIONS (FIXED FOR MOBILE/TABLET) ==========
window.openModal = function(id) {
    const inc = incidents.find(i => i.id == id);
    if (!inc) { console.error('Incident not found:', id); return; }
    currentIncidentId = id;

    const titleEl     = document.getElementById('modalTitle');
    const locationEl  = document.getElementById('modalLocation');
    const reporterEl  = document.getElementById('modalReporter');
    const studentIdEl = document.getElementById('modalStudentId');
    const dateEl      = document.getElementById('modalDate');
    const descEl      = document.getElementById('modalDescription');
    const categoryEl  = document.getElementById('modalCategory');
    const priorityEl  = document.getElementById('modalPriority');
    const statusSelect = document.getElementById('modalStatus');

    if (titleEl)     titleEl.innerText     = inc.name;
    if (locationEl)  locationEl.innerText  = inc.location;
    if (reporterEl)  reporterEl.innerText  = inc.is_anonymous === true ? 'Anonymous Reporter' : inc.reporter;
    if (studentIdEl) studentIdEl.innerText = inc.is_anonymous === true ? 'Hidden' : inc.student_id_number;
    if (dateEl)      dateEl.innerText      = new Date(inc.timestamp).toLocaleString();
    if (descEl)      descEl.innerText      = inc.description || 'No description provided';

    if (categoryEl) {
        categoryEl.innerHTML = `<span class="badge" style="background:${getCategoryColor(inc.category)}20;color:${getCategoryColor(inc.category)}">${inc.category.charAt(0).toUpperCase() + inc.category.slice(1)}</span>`;
    }
    if (priorityEl) {
        priorityEl.innerHTML = `<span class="badge ${inc.priority === 'high' ? 'b-high' : inc.priority === 'medium' ? 'b-medium' : 'b-low'}">${inc.priority.toUpperCase()}</span>`;
    }
    if (statusSelect) statusSelect.value = inc.status;

    const modalImage = document.getElementById('modalImage');
    const noImageDiv = document.getElementById('noImage');
    if (modalImage && noImageDiv) {
        if (inc.image_url && inc.image_url !== 'null' && inc.image_url !== '' && inc.image_url !== 'undefined') {
            modalImage.src = inc.image_url;
            modalImage.style.display = 'block';
            noImageDiv.style.display = 'none';
            modalImage.onerror = () => {
                modalImage.style.display = 'none';
                noImageDiv.style.display = 'flex';
                noImageDiv.innerHTML = `<p style="color:var(--muted);">⚠️ Image failed to load</p>`;
            };
        } else {
            modalImage.style.display = 'none';
            noImageDiv.style.display = 'flex';
            noImageDiv.innerHTML = `<p style="color:var(--muted);">No image attached</p>`;
        }
    }

    const modal = document.getElementById('incidentModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
};

window.closeModal = function() {
    const modal = document.getElementById('incidentModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
    currentIncidentId = null;
};

// ========== SAVE STATUS (FIXED - no notification constructor error) ==========
window.saveStatus = async function() {
    if (!currentIncidentId) { showToast('No incident selected', 'error'); return; }

    const newStatus = document.getElementById('modalStatus').value;
    const incident  = incidents.find(i => i.id == currentIncidentId);
    if (!incident)  { showToast('Incident not found', 'error'); return; }
    if (newStatus === incident.status) { window.closeModal(); return; }

    const saveBtn      = document.querySelector('.btn-save');
    const originalText = saveBtn ? saveBtn.textContent : 'Save';
    if (saveBtn) { saveBtn.textContent = 'Saving...'; saveBtn.disabled = true; }

    try {
        const updateData = {
            status: newStatus,
            updated_at: new Date().toISOString()
        };
        if (newStatus === 'resolved' && incident.status !== 'resolved') {
            updateData.resolved_at = new Date().toISOString();
        } else if (newStatus !== 'resolved') {
            updateData.resolved_at = null;
        }

        const { error } = await supabase
            .from('incident')
            .update(updateData)
            .eq('id', currentIncidentId);

        if (error) throw error;

        const oldStatus = incident.status;
        incident.status     = newStatus;
        incident.resolved_at = updateData.resolved_at || null;
        
        // Add notification for status change (safe - no constructor errors)
        addInternalNotification(
            'Status Updated',
            `Incident "${incident.name}" status changed from ${oldStatus} to ${newStatus}`,
            false
        );

        renderIncidents();
        updateStats();
        showToast(`✅ Status updated to "${newStatus}"`, 'success');
        window.closeModal();
    } catch (error) {
        console.error('Save error:', error);
        showToast('❌ Failed to update status: ' + (error.message || 'Unknown error'), 'error');
    } finally {
        if (saveBtn) { saveBtn.textContent = originalText; saveBtn.disabled = false; }
    }
};

// ========== DELETE ==========
window.deleteIncident = async function(id) {
    const incident = incidents.find(i => i.id == id);
    if (!incident) return;

    if (!confirm(`⚠️ Are you sure you want to permanently delete this incident?\n\n"${incident.name}"\n\nThis cannot be undone.`)) return;

    showToast('Deleting incident...', 'info');

    try {
        const { error } = await supabase.from('incident').delete().eq('id', id);
        if (error) throw error;

        incidents = incidents.filter(i => i.id != id);
        renderIncidents();
        updateStats();
        if (currentIncidentId == id) window.closeModal();
        showToast('✅ Incident permanently deleted.', 'success');
    } catch (error) {
        console.error('Delete error:', error);
        showToast('❌ Delete failed: ' + (error.message || 'Unknown error'), 'error');
        await loadIncidents();
    }
};

// ========== EXPORT ==========
window.exportToCSV = function() {
    const filtered = getFilteredIncidents();
    if (filtered.length === 0) { showToast('No incidents to export', 'error'); return; }
    let csv = "ID,Title,Location,Category,Priority,Status,Reporter,Student ID,Date,Description\n";
    filtered.forEach(i => {
        csv += `"${i.id}","${escapeCsv(i.name)}","${escapeCsv(i.location)}","${i.category}","${i.priority}","${i.status}","${escapeCsv(i.reporter)}","${i.student_id_number}","${new Date(i.timestamp).toLocaleString()}","${escapeCsv(i.description)}"\n`;
    });
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `incidents_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    showToast('✅ Report exported successfully', 'success');
};

// ========== HELPERS ==========
function showToast(message, type = 'success') {
    // Remove existing toasts to prevent accumulation
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'urgent' ? '#DC2626' : (type === 'error' ? '#DC2626' : '#10B981')};
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: 'Inter', sans-serif;
        font-weight: 500;
        max-width: 350px;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        if (toast && toast.remove) toast.remove();
    }, 3000);
}

function escapeCsv(str) { if (!str) return ''; return str.replace(/"/g, '""'); }
function getCategoryIcon(cat) { return { security: '⚠️', maintenance: '🔧', janitorial: '🧹', facilities: '🏢' }[cat] || '📋'; }
function getCategoryColor(cat) { return { security: '#DC2626', maintenance: '#2563EB', janitorial: '#1D9E75', facilities: '#D97706' }[cat] || '#6B7280'; }

function getTimeAgo(date) {
    const diff = Math.floor((Date.now() - date) / 1000);
    const mins = Math.floor(diff / 60);
    const hrs  = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ago`;
    if (hrs  > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'Just now';
}

function escapeHtml(t) {
    if (!t) return '';
    return String(t).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// ========== FILTERS ==========
function setupFilters() {
    const searchInput    = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const statusFilter   = document.getElementById('statusFilter');

    if (searchInput)    searchInput.addEventListener('input',  () => { currentPage = 1; renderIncidents(); });
    if (categoryFilter) categoryFilter.addEventListener('change', () => { currentPage = 1; renderIncidents(); });
    if (priorityFilter) priorityFilter.addEventListener('change', () => { currentPage = 1; renderIncidents(); });
    if (statusFilter)   statusFilter.addEventListener('change',   () => { currentPage = 1; renderIncidents(); });
}

// ========== NAV ==========
function setupNav() {
    const drawer   = document.getElementById('drawer');
    const overlay  = document.getElementById('overlay');
    const adminPill = document.getElementById('adminPill');

    if (adminPill && window.innerWidth <= 768) {
        adminPill.onclick = () => {
            if (drawer) { drawer.classList.toggle('open'); if (overlay) overlay.classList.toggle('open'); }
        };
    }
    if (overlay) overlay.onclick = () => { if (drawer) drawer.classList.remove('open'); overlay.classList.remove('open'); };

    document.querySelectorAll('.drawer-item').forEach(item => {
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        newItem.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            if (page === 'dashboard') window.location.href = '/Assets/Admin_dashboard/Admin.html';
            else if (page === 'analytics') window.location.href = '/Assets/Admin_dashboard/analytics/analytics.html';
            else if (page === 'users')     window.location.href = '/Assets/Admin_dashboard/user_page/user.html';
            else if (page === 'settings')  window.location.href = '/Assets/Admin_dashboard/settings/setting.html';
            if (drawer)  drawer.classList.remove('open');
            if (overlay) overlay.classList.remove('open');
        });
    });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        newLogoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('currentStudent');
                localStorage.removeItem('currentAdmin');
                localStorage.removeItem('isAdminLoggedIn');
                showToast('Logged out successfully', 'success');
                setTimeout(() => { window.location.href = '/land.html'; }, 500);
            }
        });
    }
}

function initBottomNav() {
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        newItem.addEventListener('click', (e) => {
            e.preventDefault();
            const page = newItem.dataset.page;
            if (page === 'dashboard')  window.location.href = '/Assets/Admin_dashboard/Admin.html';
            else if (page === 'incidents') window.location.href = '/Assets/Admin_dashboard/incident/incident.html';
            else if (page === 'users')     window.location.href = '/Assets/Admin_dashboard/user_page/user.html';
            else if (page === 'analytics') window.location.href = '/Assets/Admin_dashboard/analytics/analytics.html';
            else if (page === 'settings')  window.location.href = '/Assets/Admin_dashboard/settings/setting.html';
        });
    });
}

// Add CSS animations
const styleElem = document.createElement('style');
styleElem.textContent = `
    @keyframes bellRing {
        0% { transform: rotate(0deg); }
        25% { transform: rotate(15deg); }
        50% { transform: rotate(-15deg); }
        75% { transform: rotate(5deg); }
        100% { transform: rotate(0deg); }
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    
    #notificationBell.urgent {
        animation: bellRing 0.5s ease infinite;
        color: #DC2626 !important;
    }
    
    .notification-dropdown {
        position: fixed;
        width: 360px;
        max-width: calc(100vw - 20px);
        background: var(--surface);
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        z-index: 10000;
        border: 1px solid var(--border);
        overflow: hidden;
        display: none;
    }
    
    .notification-dropdown.show {
        display: block;
    }
    
    .notification-dropdown-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: var(--surface-elevated);
        border-bottom: 1px solid var(--border);
        font-weight: 600;
        color: var(--text);
    }
    
    .clear-all-dropdown {
        background: none;
        border: none;
        color: var(--primary);
        font-size: 12px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 8px;
    }
    
    .clear-all-dropdown:hover {
        background: var(--hover);
    }
    
    .notification-dropdown-list {
        max-height: 400px;
        overflow-y: auto;
    }
    
    .notification-dropdown-item {
        padding: 12px 16px;
        border-bottom: 1px solid var(--border);
        cursor: pointer;
        transition: background 0.2s;
    }
    
    .notification-dropdown-item:hover {
        background: var(--hover);
    }
    
    .notification-dropdown-item.unread {
        background: var(--primary-light);
    }
    
    .notification-dropdown-item.urgent {
        border-left: 3px solid #DC2626;
    }
    
    .notification-dropdown-title {
        font-weight: 600;
        font-size: 13px;
        color: var(--text);
        margin-bottom: 4px;
    }
    
    .notification-dropdown-message {
        font-size: 12px;
        color: var(--muted);
        margin-bottom: 6px;
    }
    
    .notification-dropdown-time {
        font-size: 10px;
        color: var(--hint);
    }
    
    .notification-dropdown-empty {
        text-align: center;
        padding: 40px 20px;
        color: var(--muted);
    }
    
    .notification-dropdown-footer {
        text-align: center;
        padding: 10px;
        font-size: 11px;
        color: var(--hint);
        background: var(--surface-elevated);
    }
    
    /* Mobile/Tablet touch-friendly buttons */
    @media (max-width: 768px) {
        .action-btn, .page-btn, .btn-save, .btn-cancel {
            min-height: 44px;
            min-width: 44px;
        }
        
        .modal-container {
            width: 95%;
            margin: 10px auto;
        }
        
        #modalStatus {
            min-height: 44px;
            font-size: 16px;
        }
    }
`;
document.head.appendChild(styleElem);

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing incident management with unified notifications...');

    requestNotificationPermission();
    loadAdminProfile();
    loadIncidents();
    loadNotifications();
    setupNotificationBell();
    initDarkMode();
    setupFilters();
    setupNav();
    setupRealtimeSubscription();
    initBottomNav();
});