// ========== INCIDENT MANAGEMENT SYSTEM ==========
let incidents = [];
let currentPage = 1;
const itemsPerPage = 10;

// ONLY load from localStorage - NO SAMPLE DATA EVER
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
            image_url: r.imageUrl || null,
            student_id_number: r.studentIdNumber || 'N/A'
        }));
    } else {
        // EMPTY - NO DEMO DATA
        incidents = [];
    }
    
    renderIncidents();
    updateStats();
}

function saveIncidents() {
    const toStore = incidents.map(i => ({
        id: i.id, title: i.name, location: i.location, category: i.category,
        priority: i.priority, status: i.status, studentName: i.reporter,
        description: i.description, timestamp: i.timestamp, imageUrl: i.image_url,
        studentIdNumber: i.student_id_number
    }));
    localStorage.setItem('campus_care_reports', JSON.stringify(toStore));
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
            <td>${escapeHtml(inc.reporter)}</span></td>
            <td>${inc.student_id_number}</span></td>
            <td>${getTimeAgo(new Date(inc.timestamp))}</span></td>
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

window.deleteIncident = function(id) { 
    if (confirm('Delete this incident?')) { 
        incidents = incidents.filter(i => i.id !== id); 
        saveIncidents(); 
        renderIncidents(); 
        updateStats(); 
        showNotification('Incident deleted', 'success'); 
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
    document.getElementById('modalPriority').innerHTML = `<span class="badge">${inc.priority}</span>`;
    document.getElementById('modalReporter').innerText = inc.reporter;
    document.getElementById('modalStudentId').innerText = inc.student_id_number;
    document.getElementById('modalDate').innerText = new Date(inc.timestamp).toLocaleString();
    document.getElementById('modalDescription').innerText = inc.description || 'No description';
    document.getElementById('modalStatus').value = inc.status;
    document.getElementById('incidentModal').style.display = 'flex';
};

window.closeModal = function() { 
    document.getElementById('incidentModal').style.display = 'none'; 
};

window.saveStatus = function() {
    const inc = incidents.find(i => i.id === currentIncidentId);
    if (inc) { 
        inc.status = document.getElementById('modalStatus').value; 
        saveIncidents(); 
        renderIncidents(); 
        updateStats(); 
        showNotification('Status updated', 'success'); 
    }
    closeModal();
};

window.exportToCSV = function() {
    const filtered = getFilteredIncidents();
    let csv = "ID,Title,Location,Category,Priority,Status,Reporter,Student ID,Date,Description\n";
    filtered.forEach(i => { 
        csv += `"${i.id}","${i.name}","${i.location}","${i.category}","${i.priority}","${i.status}","${i.reporter}","${i.student_id_number}","${new Date(i.timestamp).toLocaleString()}","${i.description.replace(/"/g, '""')}"\n`; 
    });
    const blob = new Blob([csv], { type: 'text/csv' }); 
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(blob); 
    a.download = `incidents_${new Date().toISOString().slice(0,19)}.csv`; 
    a.click(); 
    showNotification('Report exported', 'success');
};

function getCategoryIcon(cat) { 
    return { security:'⚠️', maintenance:'🔧', janitorial:'🧹', facilities:'🏢' }[cat] || '📋'; 
}

function getCategoryColor(cat) { 
    return { security:'#DC2626', maintenance:'#2563EB', janitorial:'#1D9E75', facilities:'#D97706' }[cat] || '#6B7280'; 
}

function getTimeAgo(date) { 
    const h = Math.floor((Date.now() - date) / 3600000); 
    if (h < 1) return 'Just now'; 
    if (h < 24) return `${h}h ago`; 
    return `${Math.floor(h / 24)}d ago`; 
}

function escapeHtml(t) { 
    if (!t) return ''; 
    return t.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m])); 
}

function showNotification(msg, type) { 
    const n = document.createElement('div'); 
    n.style.cssText = `position:fixed;bottom:20px;right:20px;background:${type === 'success' ? '#10B981' : '#3B82F6'};color:white;padding:10px 18px;border-radius:40px;z-index:2000;`; 
    n.innerText = msg; 
    document.body.appendChild(n); 
    setTimeout(() => n.remove(), 3000); 
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
    if (adminPill) adminPill.onclick = () => { drawer.classList.toggle('open'); overlay.classList.toggle('open'); };
    
    document.querySelectorAll('.drawer-item').forEach(item => {
        item.addEventListener('click', function(e) {
            const page = this.dataset.page;
            if (page === 'dashboard') window.location.href = '/Assets/Admin_dashboard/Admin.html';
            else if (page === 'incidents') window.location.href = '/Assets/Admin_dashboard/incident/incident.html';
            else if (page === 'users') window.location.href = '/Assets/Admin_dashboard/user_page/user.html';
            else showNotification(`${page} page coming soon`, 'info');
        });
    });
    
    document.getElementById('logoutBtn')?.addEventListener('click', () => { 
        if(confirm('Logout?')) { 
            localStorage.removeItem('currentStudent'); 
            window.location.href = '/LANDING PAGE/land.html'; 
        } 
    });
}

// Clear any existing demo data from localStorage before loading
const existingData = localStorage.getItem('campus_care_reports');
if (existingData) {
    const parsed = JSON.parse(existingData);
    // If data contains demo IDs (1,2,3) or demo names, clear it
    if (parsed.length > 0 && parsed.some(r => r.id === 1 || r.id === 2 || r.id === 3 || r.title === "Sharp knife abandoned" || r.title === "Dirty Toilet")) {
        localStorage.removeItem('campus_care_reports');
    }
}

loadIncidents();
setupFilters();
setupNav();

window.addEventListener('storage', (e) => { 
    if (e.key === 'campus_care_reports') { 
        loadIncidents(); 
        showNotification('New reports received', 'info'); 
    } 
});