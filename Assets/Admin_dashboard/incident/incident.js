// ========== INCIDENT MANAGEMENT SYSTEM ==========
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase configuration
const supabaseUrl = 'https://opjyksksnccurdwyskiu.supabase.co'
const supabaseKey = 'sb_publishable_l7mKNQVJ6WesiTM4GJCxQg_oXxTN3it'
const supabase = createClient(supabaseUrl, supabaseKey)

let incidents = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentAdmin = null;
let currentIncidentId = null;
let realtimeSubscription = null;

// ============ LOAD ADMIN PROFILE ============
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
        if (drawerAvatar) {
            drawerAvatar.innerHTML = `<span style="font-size:16px;font-weight:600;color:white;">${adminInitials}</span>`;
        }

        return true;
    } catch (error) {
        console.error('Error loading admin profile:', error);
        return false;
    }
}

// ============ LOAD INCIDENTS FROM SUPABASE ============
async function loadIncidents() {
    try {
        console.log('Loading incidents from Supabase...');

        const { data, error } = await supabase
            .from('incident')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            showNotification('⚠️ Failed to load from database. Showing cached data.', 'error');
            loadFromLocalStorage();
            return;
        }

        incidents = (data || []).map(r => ({
            id: r.id,
            name: r.title,
            location: r.location,
            category: r.category || 'maintenance',
            priority: r.priority || 'medium',
            status: r.status || 'pending',
            reporter: r.student_name || 'Student',
            student_id_number: r.student_id_number || 'N/A',
            description: r.description || '',
            timestamp: new Date(r.created_at),
            image_url: r.image_url || null,
            is_anonymous: r.is_anonymous,
            resolved_at: r.resolved_at || null
        }));

        console.log(`✅ Loaded ${incidents.length} incidents from Supabase`);
        renderIncidents();
        updateStats();

    } catch (err) {
        console.error('Unexpected error loading incidents:', err);
        loadFromLocalStorage();
    }
}

function loadFromLocalStorage() {
    const stored = localStorage.getItem('campus_care_reports');
    if (stored && stored !== '[]') {
        const reports = JSON.parse(stored);
        incidents = reports.map(r => ({
            id: r.id,
            name: r.title || r.name,
            location: r.location,
            category: r.category || 'maintenance',
            priority: r.priority || 'medium',
            status: r.status || 'pending',
            reporter: r.studentName || r.reporter || 'Student',
            student_id_number: r.studentIdNumber || r.student_id_number || 'N/A',
            description: r.description || '',
            timestamp: new Date(r.timestamp || r.created_at),
            image_url: r.imageUrl || r.image_url || null,
            is_anonymous: r.is_anonymous,
            resolved_at: r.resolved_at || null
        }));
    } else {
        incidents = [];
    }
    renderIncidents();
    updateStats();
}

// ============ REAL-TIME SUBSCRIPTION ============
function setupRealtimeSubscription() {
    if (realtimeSubscription) return;

    realtimeSubscription = supabase
        .channel('incident-page-changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'incident' },
            (payload) => {
                console.log('Real-time update:', payload.eventType);
                loadIncidents();
            }
        )
        .subscribe();
}

// ============ DELETE INCIDENT ============
window.deleteIncident = async function(id) {
    const incident = incidents.find(i => i.id === id);
    if (!incident) return;

    const confirmed = confirm(
        `⚠️ Are you sure you want to permanently delete this incident?\n\n"${incident.name}"\n\nThis cannot be undone and will remove it from all dashboards.`
    );
    if (!confirmed) return;

    incidents = incidents.filter(i => i.id !== id);
    renderIncidents();
    updateStats();
    closeModal();

    const { error } = await supabase
        .from('incident')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Delete failed:', error);
        showNotification('❌ Delete failed: ' + (error.message || 'Unknown error'), 'error');
        await loadIncidents();
        return;
    }

    console.log(`✅ Deleted incident ${id} from Supabase`);
    showNotification('✅ Incident permanently deleted.', 'success');
};

// ============ UPDATE STATUS ============
window.saveStatus = async function() {
    if (!currentIncidentId) return;

    const newStatus = document.getElementById('modalStatus').value;
    const incident = incidents.find(i => i.id === currentIncidentId);
    if (!incident) return;

    if (newStatus === incident.status) {
        closeModal();
        return;
    }

    const saveBtn = document.getElementById('modalSaveBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }

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

    if (error) {
        console.error('Status update failed:', error);
        showNotification('❌ Failed to update status: ' + (error.message || 'Unknown error'), 'error');
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Status'; }
        return;
    }

    console.log(`✅ Status updated to "${newStatus}" for incident ${currentIncidentId}`);
    showNotification(`✅ Status updated to "${newStatus}"`, 'success');

    incident.status = newStatus;
    incident.resolved_at = updateData.resolved_at || null;

    renderIncidents();
    updateStats();
    closeModal();
};

// ============ STATS ============
function updateStats() {
    const totalEl = document.getElementById('totalIncidents');
    const pendingEl = document.getElementById('pendingIncidents');
    const inProgressEl = document.getElementById('inProgressIncidents');
    const resolvedEl = document.getElementById('resolvedIncidents');

    if (totalEl) totalEl.textContent = incidents.length;
    if (pendingEl) pendingEl.textContent = incidents.filter(i => i.status === 'pending').length;
    if (inProgressEl) inProgressEl.textContent = incidents.filter(i => i.status === 'in-progress').length;
    if (resolvedEl) resolvedEl.textContent = incidents.filter(i => i.status === 'resolved').length;
}

// ============ FILTERING & RENDERING ============
function getFilteredIncidents() {
    let filtered = [...incidents];
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || 'all';
    const priority = document.getElementById('priorityFilter')?.value || 'all';
    const status = document.getElementById('statusFilter')?.value || 'all';

    if (search) filtered = filtered.filter(i =>
        i.name.toLowerCase().includes(search) ||
        i.reporter.toLowerCase().includes(search) ||
        i.location.toLowerCase().includes(search)
    );
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
                    <div>
                        <strong>${escapeHtml(inc.name)}</strong><br>
                        <span style="font-size:11px;color:var(--muted)">${escapeHtml(inc.location)}</span>
                    </div>
                </div>
            </td>
            <td><span class="badge" style="background:${getCategoryColor(inc.category)}20;color:${getCategoryColor(inc.category)}">${inc.category.charAt(0).toUpperCase() + inc.category.slice(1)}</span></td>
            <td><span class="badge ${inc.priority === 'high' ? 'b-high' : inc.priority === 'medium' ? 'b-medium' : 'b-low'}">${inc.priority.toUpperCase()}</span></td>
            <td><span class="badge ${inc.status === 'pending' ? 'b-pending' : inc.status === 'in-progress' ? 'b-inprogress' : 'b-resolved'}">${inc.status}</span></td>
            <td>${escapeHtml(inc.is_anonymous === 'true' ? 'Anonymous' : inc.reporter)}</td>
            <td>${inc.is_anonymous === 'true' ? 'Hidden' : inc.student_id_number}</td>
            <td>${getTimeAgo(new Date(inc.timestamp))}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn" onclick="openModal(${inc.id})" title="View & Edit">👁️</button>
                    <button class="action-btn del" onclick="deleteIncident(${inc.id})" title="Delete">🗑️</button>
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
                    <strong>${escapeHtml(inc.name)}</strong>
                    <div style="font-size:11px;color:var(--muted)">${escapeHtml(inc.location)}</div>
                </div>
            </div>
            <div class="m-card-body">
                <div><div class="m-field-label">Category</div><span class="badge">${inc.category}</span></div>
                <div><div class="m-field-label">Priority</div><span class="badge">${inc.priority}</span></div>
                <div><div class="m-field-label">Status</div><span class="badge">${inc.status}</span></div>
                <div><div class="m-field-label">Reporter</div>${escapeHtml(inc.is_anonymous === 'true' ? 'Anonymous' : inc.reporter)}</div>
            </div>
            <div class="m-card-footer">
                <div class="m-timestamp">${getTimeAgo(new Date(inc.timestamp))}</div>
                <div class="action-btns">
                    <button class="action-btn" onclick="openModal(${inc.id})" title="View & Edit">👁️</button>
                    <button class="action-btn del" onclick="deleteIncident(${inc.id})" title="Delete">🗑️</button>
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

// ============ MODAL ============
window.openModal = function(id) {
    const inc = incidents.find(i => i.id === id);
    if (!inc) return;
    currentIncidentId = id;

    document.getElementById('modalTitle').innerText = inc.name;
    document.getElementById('modalLocation').innerText = inc.location;
    document.getElementById('modalCategory').innerHTML = `<span class="badge" style="background:${getCategoryColor(inc.category)}20;color:${getCategoryColor(inc.category)}">${inc.category}</span>`;
    document.getElementById('modalPriority').innerHTML = `<span class="badge ${inc.priority === 'high' ? 'b-high' : inc.priority === 'medium' ? 'b-medium' : 'b-low'}">${inc.priority}</span>`;
    document.getElementById('modalReporter').innerText = inc.is_anonymous === 'true' ? 'Anonymous Reporter' : inc.reporter;
    document.getElementById('modalStudentId').innerText = inc.is_anonymous === 'true' ? 'Hidden' : inc.student_id_number;
    document.getElementById('modalDate').innerText = new Date(inc.timestamp).toLocaleString();
    document.getElementById('modalDescription').innerText = inc.description || 'No description provided';
    document.getElementById('modalStatus').value = inc.status;

    const saveBtn = document.getElementById('modalSaveBtn');
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Status'; }

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
                noImageDiv.innerHTML = `<p>⚠️ Image failed to load</p>`;
            };
        } else {
            modalImage.style.display = 'none';
            noImageDiv.style.display = 'flex';
            noImageDiv.innerHTML = `<p>No image attached</p>`;
        }
    }

    document.getElementById('incidentModal').classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.closeModal = function() {
    const modal = document.getElementById('incidentModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
    currentIncidentId = null;
};

// ============ EXPORT CSV ============
window.exportToCSV = function() {
    const filtered = getFilteredIncidents();
    if (filtered.length === 0) {
        showNotification('No incidents to export', 'error');
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
    showNotification('✅ Report exported successfully', 'success');
};

// ============ HELPERS ============
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
function escapeHtml(t) { if (!t) return ''; return t.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m])); }

function showNotification(msg, type = 'success') {
    const n = document.createElement('div');
    n.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        background: ${type === 'success' ? '#10B981' : type === 'info' ? '#2563EB' : '#DC2626'};
        color: white; padding: 12px 24px; border-radius: 8px;
        z-index: 2000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease; max-width: 350px;
    `;
    n.innerText = msg;
    document.body.appendChild(n);
    setTimeout(() => {
        n.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => n.remove(), 300);
    }, 3000);
}

// ============ FILTERS & NAV SETUP ============
function setupFilters() {
    ['searchInput', 'categoryFilter', 'priorityFilter', 'statusFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => { currentPage = 1; renderIncidents(); });
            if (id === 'searchInput') el.addEventListener('input', () => { currentPage = 1; renderIncidents(); });
        }
    });
}

function setupNav() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('overlay');
    const hamburger = document.getElementById('hamburger');
    const adminPill = document.getElementById('adminPill');

    if (hamburger) hamburger.onclick = () => { drawer.classList.toggle('open'); overlay.classList.toggle('open'); };
    if (overlay) overlay.onclick = () => { drawer.classList.remove('open'); overlay.classList.remove('open'); };
    if (adminPill) {
        adminPill.onclick = () => {
            if (window.innerWidth <= 768) {
                drawer.classList.toggle('open');
                overlay.classList.toggle('open');
            }
        };
    }

    document.querySelectorAll('.drawer-item').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            if (page === 'dashboard') window.location.href = '/Assets/Admin_dashboard/Admin.html';
            else if (page === 'incidents') window.location.href = '/Assets/Admin_dashboard/incident/incident.html';
            else if (page === 'users') window.location.href = '/Assets/Admin_dashboard/user_page/user.html';
            else if (page === 'settings') window.location.href = '/Assets/Admin_dashboard/settings/setting.html';
            if (drawer) drawer.classList.remove('open');
            if (overlay) overlay.classList.remove('open');
        });
    });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('currentStudent');
                localStorage.removeItem('currentAdmin');
                localStorage.removeItem('isAdminLoggedIn');
                showNotification('Logged out successfully', 'success');
                setTimeout(() => { window.location.href = '/Assets/Landing_page/land.html'; }, 500);
            }
        });
    }
}

// ============ BOTTOM NAVIGATION FOR MOBILE ============
function initBottomNav() {
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    
    function getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('incident')) return 'incidents';
        if (path.includes('user_page')) return 'users';
        if (path.includes('setting')) return 'settings';
        return 'incidents';
    }
    
    function highlightActiveNav() {
        const currentPage = getCurrentPage();
        bottomNavItems.forEach(item => {
            const page = item.dataset.page;
            if (page === currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    bottomNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            if (page === 'dashboard') {
                window.location.href = '/Assets/Admin_dashboard/Admin.html';
            } else if (page === 'incidents') {
                window.location.href = '/Assets/Admin_dashboard/incident/incident.html';
            } else if (page === 'users') {
                window.location.href = '/Assets/Admin_dashboard/user_page/user.html';
            } else if (page === 'settings') {
                window.location.href = '/Assets/Admin_dashboard/settings/setting.html';
            }
        });
    });
    
    highlightActiveNav();
}

function addAnimationStyles() {
    if (document.getElementById('admin-animation-styles')) return;
    const style = document.createElement('style');
    style.id = 'admin-animation-styles';
    style.textContent = `
        @keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }
        .action-btn.del { background: #FEF2F2; color: #DC2626; }
        .action-btn.del:hover { background: #DC2626; color: white; }
    `;
    document.head.appendChild(style);
}

// ============ INITIALIZE ============
// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing incident management...');
    addAnimationStyles();
    loadAdminProfile();
    loadIncidents();
    setupFilters();
    setupNav();
    setupRealtimeSubscription();
    initBottomNav(); // Initialize bottom navigation
});