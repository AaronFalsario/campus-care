// ========== INCIDENT MANAGEMENT SYSTEM ==========
let incidents = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentAdmin = null;

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
        const adminInitials = adminName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        
        // Update drawer elements
        const drawerName = document.querySelector('.drawer-name');
        const drawerRole = document.querySelector('.drawer-role');
        const drawerAvatar = document.querySelector('.drawer-avatar');
        const adminPill = document.getElementById('adminPill');
        
        if (drawerName) drawerName.textContent = adminName;
        if (drawerRole) drawerRole.textContent = currentAdmin.role || 'Campus Care Admin';
        if (adminPill) adminPill.textContent = adminName.split(' ')[0] || 'Admin';
        
        // Update avatar with initials
        if (drawerAvatar && !drawerAvatar.querySelector('.avatar-initials')) {
            drawerAvatar.innerHTML = `<span class="avatar-initials" style="font-size: 16px; font-weight: 600;">${adminInitials}</span>`;
        }
        
        return true;
    } catch (error) {
        console.error('Error loading admin profile:', error);
        return false;
    }
}

function loadIncidents() {
    const stored = localStorage.getItem('campus_care_reports');
    
    if (stored && stored !== '[]') {
        const reports = JSON.parse(stored);
        incidents = reports.map(r => ({
            id: r.id,
            name: r.title,
            location: r.location,
            category: r.category || 'maintenance',
            priority: r.priority || 'medium',
            status: r.status || 'pending',
            reporter: r.studentName || 'Student',
            description: r.description || '',
            timestamp: new Date(r.timestamp),
            image_url: r.imageUrl || r.image_url || null,
            student_id_number: r.studentIdNumber || r.studentId || 'N/A'
        }));
    } else {
        incidents = [];
    }
    
    renderIncidents();
    updateStats();
}

function saveIncidents() {
    const toStore = incidents.map(i => ({
        id: i.id, 
        title: i.name, 
        location: i.location, 
        category: i.category,
        priority: i.priority, 
        status: i.status, 
        studentName: i.reporter,
        description: i.description, 
        timestamp: i.timestamp, 
        imageUrl: i.image_url,
        studentIdNumber: i.student_id_number
    }));
    localStorage.setItem('campus_care_reports', JSON.stringify(toStore));
    
    // Trigger storage event to notify student dashboard
    window.dispatchEvent(new StorageEvent('storage', { 
        key: 'campus_care_reports',
        newValue: JSON.stringify(toStore)
    }));
}

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
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);
    renderTable(paginated);
    renderMobileCards(paginated);
    renderPagination(totalPages);
}

function renderTable(incidentsList) {
    const tbody = document.getElementById('incidentTableBody');
    if (!tbody) return;
    
    if (incidentsList.length === 0) { 
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:60px;">📭 No incidents found</td></tr>`;
        return; 
    }
    
    tbody.innerHTML = incidentsList.map(inc => `
        <tr data-id="${inc.id}">
            <td><div class="inc-cell"><div class="inc-icon-sm" style="background:${getCategoryColor(inc.category)}20;color:${getCategoryColor(inc.category)}">${getCategoryIcon(inc.category)}</div><div><strong>${escapeHtml(inc.name)}</strong><br><span style="font-size:11px;color:var(--muted)">${escapeHtml(inc.location)}</span></div></div></td>
            <td><span class="badge" style="background:${getCategoryColor(inc.category)}20;color:${getCategoryColor(inc.category)}">${inc.category.charAt(0).toUpperCase() + inc.category.slice(1)}</span></td>
            <td><span class="badge ${inc.priority === 'high' ? 'b-high' : inc.priority === 'medium' ? 'b-medium' : 'b-low'}">${inc.priority.toUpperCase()}</span></td>
            <td><span class="badge ${inc.status === 'pending' ? 'b-pending' : inc.status === 'in-progress' ? 'b-inprogress' : 'b-resolved'}">${inc.status}</span></td>
            <td>${escapeHtml(inc.reporter)}</td>
            <td>${inc.student_id_number}</td>
            <td>${getTimeAgo(new Date(inc.timestamp))}</td>
            <td><div class="action-btns"><button class="action-btn" onclick="openModal(${inc.id})">👁️</button><button class="action-btn del" onclick="deleteIncident(${inc.id})">🗑️</button></div></td>
        </tr>
    `).join('');
}

function renderMobileCards(incidentsList) {
    const container = document.getElementById('mobileCards');
    if (!container) return;
    
    if (incidentsList.length === 0) { 
        container.innerHTML = `<div style="text-align:center;padding:40px;">📭 No incidents found</div>`; 
        return; 
    }
    
    container.innerHTML = incidentsList.map(inc => `
        <div class="m-card">
            <div class="m-card-top"><div class="inc-icon-sm" style="background:${getCategoryColor(inc.category)}20;color:${getCategoryColor(inc.category)}">${getCategoryIcon(inc.category)}</div><div><strong>${escapeHtml(inc.name)}</strong><div style="font-size:11px;color:var(--muted)">${escapeHtml(inc.location)}</div></div></div>
            <div class="m-card-body"><div><div class="m-field-label">Category</div><span class="badge">${inc.category}</span></div><div><div class="m-field-label">Priority</div><span class="badge">${inc.priority}</span></div><div><div class="m-field-label">Status</div><span class="badge">${inc.status}</span></div><div><div class="m-field-label">Reporter</div>${escapeHtml(inc.reporter)}</div></div>
            <div class="m-card-footer"><div class="m-timestamp">${getTimeAgo(new Date(inc.timestamp))}</div><div class="action-btns"><button class="action-btn" onclick="openModal(${inc.id})">👁️</button><button class="action-btn del" onclick="deleteIncident(${inc.id})">🗑️</button></div></div>
        </div>
    `).join('');
}

function renderPagination(totalPages) {
    const container = document.getElementById('pagination');
    if (!container || totalPages <= 1) { 
        if(container) container.innerHTML = ''; 
        return; 
    }
    
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

// ============ FIXED DELETE FUNCTION - COMPLETELY REMOVES FROM DATABASE ============
window.deleteIncident = function(id) { 
    if (confirm('⚠️ Are you sure you want to delete this incident?\n\nThis action CANNOT be undone and will permanently remove the report from both Admin and Student dashboards.')) { 
        // Find the incident to delete
        const incidentToDelete = incidents.find(i => i.id === id);
        
        if (!incidentToDelete) {
            showNotification('Incident not found', 'error');
            return;
        }
        
        // Remove from the incidents array
        incidents = incidents.filter(i => i.id !== id);
        
        // Save the updated array to localStorage
        saveIncidents();
        
        // Re-render the UI
        renderIncidents(); 
        updateStats(); 
        
        // Close modal if it's open
        closeModal();
        
        showNotification('✅ Incident deleted successfully from database', 'success'); 
        
        // Log for debugging
        console.log(`Deleted incident ${id}. Remaining incidents: ${incidents.length}`);
    } 
};

let currentIncidentId = null;

window.openModal = function(id) {
    const inc = incidents.find(i => i.id === id);
    if (!inc) return;
    currentIncidentId = id;
    
    document.getElementById('modalTitle').innerText = inc.name;
    document.getElementById('modalLocation').innerText = inc.location;
    document.getElementById('modalCategory').innerHTML = `<span class="badge" style="background:${getCategoryColor(inc.category)}20;color:${getCategoryColor(inc.category)}">${inc.category}</span>`;
    document.getElementById('modalPriority').innerHTML = `<span class="badge ${inc.priority === 'high' ? 'b-high' : inc.priority === 'medium' ? 'b-medium' : 'b-low'}">${inc.priority}</span>`;
    document.getElementById('modalReporter').innerText = inc.reporter;
    document.getElementById('modalStudentId').innerText = inc.student_id_number;
    document.getElementById('modalDate').innerText = new Date(inc.timestamp).toLocaleString();
    document.getElementById('modalDescription').innerText = inc.description || 'No description provided';
    document.getElementById('modalStatus').value = inc.status;
    
    const modalImage = document.getElementById('modalImage');
    const noImageDiv = document.getElementById('noImage');
    
    if (inc.image_url && inc.image_url !== 'null' && inc.image_url !== '' && inc.image_url !== 'undefined') {
        modalImage.src = inc.image_url;
        modalImage.style.display = 'block';
        if (noImageDiv) noImageDiv.style.display = 'none';
    } else {
        if (modalImage) modalImage.style.display = 'none';
        if (noImageDiv) noImageDiv.style.display = 'block';
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

window.saveStatus = function() {
    const inc = incidents.find(i => i.id === currentIncidentId);
    if (inc) { 
        inc.status = document.getElementById('modalStatus').value; 
        saveIncidents(); 
        renderIncidents(); 
        updateStats(); 
        showNotification('Status updated successfully', 'success'); 
        window.dispatchEvent(new StorageEvent('storage', { key: 'campus_care_reports' }));
    }
    closeModal();
};

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
    const url = URL.createObjectURL(blob); 
    a.href = url; 
    a.download = `incidents_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.csv`; 
    document.body.appendChild(a);
    a.click(); 
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Report exported successfully', 'success');
};

// Helper function to escape CSV fields
function escapeCsv(str) {
    if (!str) return '';
    return str.replace(/"/g, '""');
}

function getCategoryIcon(cat) { 
    return { security:'⚠️', maintenance:'🔧', janitorial:'🧹', facilities:'🏢' }[cat] || '📋'; 
}

function getCategoryColor(cat) { 
    return { security:'#DC2626', maintenance:'#2563EB', janitorial:'#1D9E75', facilities:'#D97706' }[cat] || '#6B7280'; 
}

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

function escapeHtml(t) { 
    if (!t) return ''; 
    return t.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m])); 
}

function showNotification(msg, type = 'success') { 
    const n = document.createElement('div'); 
    n.style.cssText = `position:fixed;bottom:20px;right:20px;background:${type === 'success' ? '#10B981' : '#DC2626'};color:white;padding:12px 24px;border-radius:8px;z-index:2000;box-shadow:0 4px 12px rgba(0,0,0,0.15);animation:slideIn 0.3s ease;`; 
    n.innerText = msg; 
    document.body.appendChild(n); 
    setTimeout(() => {
        n.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => n.remove(), 300);
    }, 3000); 
}

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
        item.addEventListener('click', function(e) {
            const page = this.dataset.page;
            if (page === 'dashboard') window.location.href = '/Assets/Admin_dashboard/Admin.html';
            else if (page === 'incidents') window.location.href = '/Assets/Admin_dashboard/incident/incident.html';
            else if (page === 'users') window.location.href = '/Assets/Admin_dashboard/user_page/user.html';
            else if (page === 'settings') window.location.href = '/Assets/Admin_dashboard/settings/setting.html';
        });
    });
    
    // Fixed Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('currentStudent');
                localStorage.removeItem('currentAdmin');
                localStorage.removeItem('isAdminLoggedIn');
                showNotification('Logged out successfully', 'success');
                setTimeout(() => {
                    window.location.href = '/Assets/Landing_page/land.html';
                }, 500);
            }
        });
    }
}

function updateDrawerAvatar() {
    const storedAdmin = localStorage.getItem('currentAdmin');
    if (storedAdmin) {
        const admin = JSON.parse(storedAdmin);
        const adminName = admin.name || admin.email;
        const initials = adminName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const drawerAvatar = document.querySelector('.drawer-avatar');
        if (drawerAvatar) {
            drawerAvatar.innerHTML = `<span style="font-size: 16px; font-weight: 600; color: white;">${initials}</span>`;
        }
    }
}

// Add animation styles if not present
function addAnimationStyles() {
    if (!document.getElementById('admin-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'admin-animation-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize
addAnimationStyles();
loadAdminProfile();
updateDrawerAvatar();
loadIncidents();
setupFilters();
setupNav();

window.addEventListener('storage', (e) => { 
    if (e.key === 'campus_care_reports') { 
        loadIncidents(); 
        showNotification('🔄 Reports updated from another window', 'info'); 
    } 
});