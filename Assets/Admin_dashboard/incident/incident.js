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
let lastUrgentTime = 0;

// ========== GLOBAL FUNCTIONS FOR HTML ONCLICK ==========
window.openModal = null;
window.closeModal = null;
window.saveStatus = null;
window.deleteIncident = null;
window.exportToCSV = null;

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
                if (isDark) {
                    sunIcon.style.display = 'none';
                    moonIcon.style.display = 'block';
                } else {
                    sunIcon.style.display = 'block';
                    moonIcon.style.display = 'none';
                }
            }
        });
    }
}

// ========== NOTIFICATION SYSTEM ==========
let notifications = [];
let notificationIdCounter = 0;
let isNotificationDropdownOpen = false;

function loadNotifications() {
    const stored = localStorage.getItem('incident_notifications');
    if (stored) {
        try {
            notifications = JSON.parse(stored);
            notificationIdCounter = notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 0;
        } catch (e) {
            notifications = [];
            notificationIdCounter = 0;
        }
    } else {
        notifications = [];
    }
    updateNotificationBadge();
    createNotificationDropdown();
    updateNotificationDropdown();
}

function saveNotifications() {
    localStorage.setItem('incident_notifications', JSON.stringify(notifications));
    updateNotificationBadge();
}

function addInternalNotification(title, message, isUrgent = false) {
    const notification = {
        id: notificationIdCounter++,
        title: title,
        message: message,
        timestamp: new Date().toISOString(),
        read: false,
        isUrgent: isUrgent
    };
    notifications.unshift(notification);
    saveNotifications();
    updateNotificationDropdown();
    if (notifications.length > 50) notifications = notifications.slice(0, 50);
}

function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const urgentCount = notifications.filter(n => !n.read && n.isUrgent).length;
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = urgentCount > 0 ? `🔥${unreadCount}` : (unreadCount > 9 ? '9+' : unreadCount);
            badge.style.display = 'flex';
            if (urgentCount > 0) {
                badge.style.background = '#DC2626';
                badge.style.animation = 'pulse 0.5s ease infinite';
            } else {
                badge.style.background = 'var(--red)';
                badge.style.animation = 'none';
            }
        } else {
            badge.style.display = 'none';
        }
    }
}

function createNotificationDropdown() {
    let dropdown = document.getElementById('notificationDropdown');
    if (dropdown) dropdown.remove();
    dropdown = document.createElement('div');
    dropdown.id = 'notificationDropdown';
    dropdown.className = 'notification-dropdown';
    document.body.appendChild(dropdown);
    return dropdown;
}

function updateNotificationDropdown() {
    let dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) dropdown = createNotificationDropdown();
    
    if (!notifications || notifications.length === 0) {
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
                <p style="font-size: 11px; margin-top: 4px;">New incident reports will appear here</p>
            </div>
        `;
        return;
    }
    
    const unreadCount = notifications.filter(n => !n.read).length;
    dropdown.innerHTML = `
        <div class="notification-dropdown-header">
            <span>🔔 Notifications ${unreadCount > 0 ? `(${unreadCount})` : ''}</span>
            <button class="clear-all-dropdown" onclick="window.clearAllNotifications()">Clear all</button>
        </div>
        <div class="notification-dropdown-list">
            ${notifications.slice(0, 15).map(notif => `
                <div class="notification-dropdown-item ${!notif.read ? 'unread' : ''} ${notif.isUrgent ? 'urgent' : ''}" onclick="window.markNotificationRead(${notif.id})">
                    <div class="notification-dropdown-title">${notif.isUrgent ? '🚨 ' : '📋 '}${escapeHtml(notif.title)}</div>
                    <div class="notification-dropdown-message">${escapeHtml(notif.message)}</div>
                    <div class="notification-dropdown-time">${getTimeAgo(new Date(notif.timestamp))}</div>
                </div>
            `).join('')}
        </div>
        ${notifications.length > 15 ? `<div class="notification-dropdown-footer">${notifications.length - 15} more notifications</div>` : ''}
    `;
}

function toggleNotificationDropdown() {
    let dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) {
        dropdown = createNotificationDropdown();
        updateNotificationDropdown();
    }
    
    if (isNotificationDropdownOpen) {
        dropdown.classList.remove('show');
        isNotificationDropdownOpen = false;
        document.removeEventListener('click', closeNotificationDropdownOutside);
    } else {
        const bell = document.getElementById('notificationBell');
        if (bell) {
            const rect = bell.getBoundingClientRect();
            dropdown.style.top = `${rect.bottom + 8}px`;
            dropdown.style.right = `${window.innerWidth - rect.right}px`;
        }
        dropdown.classList.add('show');
        isNotificationDropdownOpen = true;
        setTimeout(() => document.addEventListener('click', closeNotificationDropdownOutside), 100);
    }
}

function closeNotificationDropdownOutside(e) {
    const dropdown = document.getElementById('notificationDropdown');
    const bell = document.getElementById('notificationBell');
    if (dropdown && bell && !dropdown.contains(e.target) && !bell.contains(e.target)) {
        dropdown.classList.remove('show');
        isNotificationDropdownOpen = false;
        document.removeEventListener('click', closeNotificationDropdownOutside);
    }
}

window.markNotificationRead = function(id) {
    const notif = notifications.find(n => n.id === id);
    if (notif) {
        notif.read = true;
        saveNotifications();
        updateNotificationDropdown();
    }
};

window.clearAllNotifications = function() {
    notifications = [];
    saveNotifications();
    updateNotificationDropdown();
    showToast('All notifications cleared', 'success');
};

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
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
        const drawerName = document.querySelector('.drawer-name');
        const drawerRole = document.querySelector('.drawer-role');
        const drawerAvatar = document.querySelector('.drawer-avatar');
        const adminPill = document.getElementById('adminPill');
        if (drawerName) drawerName.textContent = adminName;
        if (drawerRole) drawerRole.textContent = currentAdmin.role || 'Campus Care Admin';
        if (adminPill) adminPill.textContent = adminName.split(' ')[0] || 'Admin';
        if (drawerAvatar) drawerAvatar.innerHTML = `<span style="font-size:16px;font-weight:600;color:white;">${adminInitials}</span>`;
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
        const oldCount = incidents.length;
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
        if (data && data.length > oldCount && oldCount > 0) {
            addInternalNotification('New Incident', `${incidents[0].name} was reported`, incidents[0].priority === 'high');
        }
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
    realtimeSubscription = supabase
        .channel('incident-page-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'incident' }, () => loadIncidents())
        .subscribe();
}

// ========== STATS ==========
function updateStats() {
    const total = incidents.length;
    const pending = incidents.filter(i => i.status === 'pending').length;
    const inProgress = incidents.filter(i => i.status === 'in-progress').length;
    const resolved = incidents.filter(i => i.status === 'resolved').length;
    
    const totalEl = document.getElementById('totalIncidents');
    const pendingEl = document.getElementById('pendingIncidents');
    const inProgressEl = document.getElementById('inProgressIncidents');
    const resolvedEl = document.getElementById('resolvedIncidents');
    
    if (totalEl) totalEl.textContent = total;
    if (pendingEl) pendingEl.textContent = pending;
    if (inProgressEl) inProgressEl.textContent = inProgress;
    if (resolvedEl) resolvedEl.textContent = resolved;
}

// ========== FILTERING & RENDERING ==========
function getFilteredIncidents() {
    let filtered = [...incidents];
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || 'all';
    const priority = document.getElementById('priorityFilter')?.value || 'all';
    const status = document.getElementById('statusFilter')?.value || 'all';
    
    if (search) filtered = filtered.filter(i => i.name.toLowerCase().includes(search) || i.reporter.toLowerCase().includes(search) || i.location.toLowerCase().includes(search));
    if (category !== 'all') filtered = filtered.filter(i => i.category === category);
    if (priority !== 'all') filtered = filtered.filter(i => i.priority === priority);
    if (status !== 'all') filtered = filtered.filter(i => i.status === status);
    
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function renderIncidents() {
    const filtered = getFilteredIncidents();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
    const start = (currentPage - 1) * itemsPerPage;
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
                <div class="inc-cell">
                    <div class="inc-icon-sm" style="background:${getCategoryColor(inc.category)}20;color:${getCategoryColor(inc.category)}">${getCategoryIcon(inc.category)}</div>
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                        <strong style="font-size: 14px; font-weight: 600; color: var(--text); line-height: 1.3;">${inc.priority === 'high' ? '🚨 ' : ''}${escapeHtml(inc.name)}</strong>
                        <span style="font-size: 11px; color: var(--muted); line-height: 1.2;">📍 ${escapeHtml(inc.location)}</span>
                    </div>
                </div>
            </td>
            <td><span class="badge" style="background:${getCategoryColor(inc.category)}20;color:${getCategoryColor(inc.category)}">${inc.category.charAt(0).toUpperCase() + inc.category.slice(1)}</span></td>
            <td><span class="badge ${inc.priority === 'high' ? 'b-high' : inc.priority === 'medium' ? 'b-medium' : 'b-low'}">${inc.priority.toUpperCase()}</span></td>
            <td><span class="badge ${inc.status === 'pending' ? 'b-pending' : inc.status === 'in-progress' ? 'b-inprogress' : 'b-resolved'}">${inc.status === 'in-progress' ? 'In Progress' : inc.status}</span></td>
            <td>${escapeHtml(inc.is_anonymous === true ? 'Anonymous' : inc.reporter)}</td>
            <td>${inc.is_anonymous === true ? 'Hidden' : inc.student_id_number}</td>
            <td>${getTimeAgo(new Date(inc.timestamp))}</td>
            <tr>
                <div class="action-btns">
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
            <div class="m-card-top">
                <div class="inc-icon-sm" style="background:${getCategoryColor(inc.category)}20;color:${getCategoryColor(inc.category)}">${getCategoryIcon(inc.category)}</div>
                <div>
                    <strong style="color: var(--text);">${inc.priority === 'high' ? '🚨 ' : ''}${escapeHtml(inc.name)}</strong>
                    <div style="font-size:11px;color:var(--muted); margin-top: 2px;">📍 ${escapeHtml(inc.location)}</div>
                </div>
            </div>
            <div class="m-card-body">
                <div><div class="m-field-label" style="color: var(--muted);">Category</div><span class="badge" style="background:${getCategoryColor(inc.category)}20;color:${getCategoryColor(inc.category)}">${inc.category}</span></div>
                <div><div class="m-field-label" style="color: var(--muted);">Priority</div><span class="badge ${inc.priority === 'high' ? 'b-high' : inc.priority === 'medium' ? 'b-medium' : 'b-low'}">${inc.priority}</span></div>
                <div><div class="m-field-label" style="color: var(--muted);">Status</div><span class="badge ${inc.status === 'pending' ? 'b-pending' : inc.status === 'in-progress' ? 'b-inprogress' : 'b-resolved'}">${inc.status}</span></div>
                <div><div class="m-field-label" style="color: var(--muted);">Reporter</div><span style="color: var(--text);">${escapeHtml(inc.is_anonymous === true ? 'Anonymous' : inc.reporter)}</span></div>
            </div>
            <div class="m-card-footer">
                <div class="m-timestamp" style="color: var(--hint);">${getTimeAgo(new Date(inc.timestamp))}</div>
                <div class="action-btns">
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

// ========== MODAL FUNCTIONS ==========
window.openModal = function(id) {
    console.log('Opening modal for incident:', id);
    const inc = incidents.find(i => i.id == id);
    if (!inc) {
        console.error('Incident not found:', id);
        return;
    }
    currentIncidentId = id;
    
    const titleEl = document.getElementById('modalTitle');
    const locationEl = document.getElementById('modalLocation');
    const reporterEl = document.getElementById('modalReporter');
    const studentIdEl = document.getElementById('modalStudentId');
    const dateEl = document.getElementById('modalDate');
    const descEl = document.getElementById('modalDescription');
    const categoryEl = document.getElementById('modalCategory');
    const priorityEl = document.getElementById('modalPriority');
    const statusEl = document.getElementById('modalStatus');
    
    if (titleEl) titleEl.innerText = inc.name;
    if (locationEl) locationEl.innerText = inc.location;
    if (reporterEl) reporterEl.innerText = inc.is_anonymous === true ? 'Anonymous Reporter' : inc.reporter;
    if (studentIdEl) studentIdEl.innerText = inc.is_anonymous === true ? 'Hidden' : inc.student_id_number;
    if (dateEl) dateEl.innerText = new Date(inc.timestamp).toLocaleString();
    if (descEl) descEl.innerText = inc.description || 'No description provided';
    
    if (categoryEl) {
        categoryEl.innerHTML = `<span class="badge" style="background:${getCategoryColor(inc.category)}20;color:${getCategoryColor(inc.category)}">${inc.category.charAt(0).toUpperCase() + inc.category.slice(1)}</span>`;
    }
    
    if (priorityEl) {
        priorityEl.innerHTML = `<span class="badge ${inc.priority === 'high' ? 'b-high' : inc.priority === 'medium' ? 'b-medium' : 'b-low'}">${inc.priority.toUpperCase()}</span>`;
    }
    
    if (statusEl) statusEl.value = inc.status;
    
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
                noImageDiv.innerHTML = `<p style="color: var(--muted);">⚠️ Image failed to load</p>`;
            };
        } else {
            modalImage.style.display = 'none';
            noImageDiv.style.display = 'flex';
            noImageDiv.innerHTML = `<p style="color: var(--muted);">No image attached</p>`;
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

window.saveStatus = async function() {
    if (!currentIncidentId) return;
    const newStatus = document.getElementById('modalStatus').value;
    const incident = incidents.find(i => i.id === currentIncidentId);
    if (!incident) return;
    if (newStatus === incident.status) { window.closeModal(); return; }
    
    const updateData = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === 'resolved' && incident.status !== 'resolved') {
        updateData.resolved_at = new Date().toISOString();
    } else if (newStatus !== 'resolved') {
        updateData.resolved_at = null;
    }
    
    const { error } = await supabase.from('incident').update(updateData).eq('id', currentIncidentId);
    if (error) {
        showToast('❌ Failed to update status: ' + (error.message || 'Unknown error'), 'error');
        return;
    }
    
    incident.status = newStatus;
    incident.resolved_at = updateData.resolved_at || null;
    renderIncidents();
    updateStats();
    window.closeModal();
    showToast(`✅ Status updated to "${newStatus}"`, 'success');
};

window.deleteIncident = async function(id) {
    const incident = incidents.find(i => i.id === id);
    if (!incident) return;
    if (!confirm(`⚠️ Are you sure you want to permanently delete this incident?\n\n"${incident.name}"\n\nThis cannot be undone.`)) return;
    
    incidents = incidents.filter(i => i.id !== id);
    renderIncidents();
    updateStats();
    window.closeModal();
    
    const { error } = await supabase.from('incident').delete().eq('id', id);
    if (error) {
        showToast('❌ Delete failed: ' + (error.message || 'Unknown error'), 'error');
        await loadIncidents();
        return;
    }
    showToast('✅ Incident permanently deleted.', 'success');
};

window.exportToCSV = function() {
    const filtered = getFilteredIncidents();
    if (filtered.length === 0) {
        showToast('No incidents to export', 'error');
        return;
    }
    let csv = "ID,Title,Location,Category,Priority,Status,Reporter,Student ID,Date,Description\n";
    filtered.forEach(i => {
        csv += `"${i.id}","${escapeCsv(i.name)}","${escapeCsv(i.location)}","${i.category}","${i.priority}","${i.status}","${escapeCsv(i.reporter)}","${i.student_id_number}","${new Date(i.timestamp).toLocaleString()}","${escapeCsv(i.description)}"\n`;
    });
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `incidents_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    showToast('✅ Report exported successfully', 'success');
};

// ========== HELPERS ==========
function escapeCsv(str) { if (!str) return ''; return str.replace(/"/g, '""'); }
function getCategoryIcon(cat) { return { security: '⚠️', maintenance: '🔧', janitorial: '🧹', facilities: '🏢' }[cat] || '📋'; }
function getCategoryColor(cat) { return { security: '#DC2626', maintenance: '#2563EB', janitorial: '#1D9E75', facilities: '#D97706' }[cat] || '#6B7280'; }
function getTimeAgo(date) {
    const diff = Math.floor((Date.now() - date) / 1000);
    const mins = Math.floor(diff / 60);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'Just now';
}
function escapeHtml(t) { if (!t) return ''; return String(t).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m])); }

// ========== FILTERS & NAV SETUP ==========
function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput) searchInput.addEventListener('input', () => { currentPage = 1; renderIncidents(); });
    if (categoryFilter) categoryFilter.addEventListener('change', () => { currentPage = 1; renderIncidents(); });
    if (priorityFilter) priorityFilter.addEventListener('change', () => { currentPage = 1; renderIncidents(); });
    if (statusFilter) statusFilter.addEventListener('change', () => { currentPage = 1; renderIncidents(); });
}

function setupNav() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('overlay');
    const adminPill = document.getElementById('adminPill');
    const notificationBell = document.getElementById('notificationBell');
    
    if (notificationBell) notificationBell.addEventListener('click', (e) => { e.stopPropagation(); toggleNotificationDropdown(); });
    if (adminPill && window.innerWidth <= 768) {
        adminPill.onclick = () => { if (drawer) { drawer.classList.toggle('open'); if (overlay) overlay.classList.toggle('open'); } };
    }
    if (overlay) overlay.onclick = () => { if (drawer) drawer.classList.remove('open'); overlay.classList.remove('open'); };
    
    document.querySelectorAll('.drawer-item').forEach(item => {
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        newItem.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            if (page === 'dashboard') {
                window.location.href = '/Assets/Admin_dashboard/Admin.html';
            } else if (page === 'analytics') {
                window.location.href = '/Assets/Admin_dashboard/analytics/analytics.html';
            } else if (page === 'users') {
                window.location.href = '/Assets/Admin_dashboard/user_page/user.html';
            } else if (page === 'settings') {
                window.location.href = '/Assets/Admin_dashboard/settings/setting.html';
            }
            if (drawer) drawer.classList.remove('open');
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
                setTimeout(() => { window.location.href = '/Assets/Landing_page/land.html'; }, 500);
            }
        });
    }
}

function initBottomNav() {
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    bottomNavItems.forEach(item => {
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        newItem.addEventListener('click', (e) => {
            e.preventDefault();
            const page = newItem.dataset.page;
            if (page === 'dashboard') {
                window.location.href = '/Assets/Admin_dashboard/Admin.html';
            } else if (page === 'incidents') {
                window.location.href = '/Assets/Admin_dashboard/incident/incident.html';
            } else if (page === 'users') {
                window.location.href = '/Assets/Admin_dashboard/user_page/user.html';
            } else if (page === 'analytics') {
                window.location.href = '/Assets/Admin_dashboard/analytics/analytics.html';
            } else if (page === 'settings') {
                window.location.href = '/Assets/Admin_dashboard/settings/setting.html';
            }
        });
    });
}

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing incident management...');
    loadAdminProfile();
    loadIncidents();
    loadNotifications();
    initDarkMode();
    setupFilters();
    setupNav();
    setupRealtimeSubscription();
    initBottomNav();
});