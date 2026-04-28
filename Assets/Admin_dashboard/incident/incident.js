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
            image_url: r.imageUrl || r.image_url || null,
            student_id_number: r.studentIdNumber || r.studentId || 'N/A'
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
            <td>${escapeHtml(inc.reporter)}</td>
            <td>${inc.student_id_number}</td>
            <td>${getTimeAgo(new Date(inc.timestamp))}</td>
            <td><div class="action-btns"><button class="action-btn" onclick="openModal(${inc.id})">👁️</button><button class="action-btn del" onclick="deleteIncident(${inc.id})">🗑️</button></div></td>
        <\/tr>
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

// ========== FIXED MODAL WITH IMAGE DISPLAY ==========
window.openModal = function(id) {
    const inc = incidents.find(i => i.id === id);
    if (!inc) return;
    currentIncidentId = id;
    
    // Update text fields
    const modalTitle = document.getElementById('modalTitle');
    const modalLocation = document.getElementById('modalLocation');
    const modalCategory = document.getElementById('modalCategory');
    const modalPriority = document.getElementById('modalPriority');
    const modalReporter = document.getElementById('modalReporter');
    const modalStudentId = document.getElementById('modalStudentId');
    const modalDate = document.getElementById('modalDate');
    const modalDescription = document.getElementById('modalDescription');
    const modalStatus = document.getElementById('modalStatus');
    const modalImage = document.getElementById('modalImage');
    const noImageDiv = document.getElementById('noImage');
    
    if (modalTitle) modalTitle.innerText = inc.name;
    if (modalLocation) modalLocation.innerText = inc.location;
    if (modalCategory) modalCategory.innerHTML = `<span class="badge" style="background:${getCategoryColor(inc.category)}20;color:${getCategoryColor(inc.category)}">${inc.category}</span>`;
    if (modalPriority) modalPriority.innerHTML = `<span class="badge ${inc.priority === 'high' ? 'b-high' : inc.priority === 'medium' ? 'b-medium' : 'b-low'}">${inc.priority}</span>`;
    if (modalReporter) modalReporter.innerText = inc.reporter;
    if (modalStudentId) modalStudentId.innerText = inc.student_id_number;
    if (modalDate) modalDate.innerText = new Date(inc.timestamp).toLocaleString();
    if (modalDescription) modalDescription.innerText = inc.description || 'No description provided';
    if (modalStatus) modalStatus.value = inc.status;
    
    // ========== DISPLAY IMAGE IF EXISTS ==========
    if (modalImage && noImageDiv) {
        if (inc.image_url && inc.image_url !== 'null' && inc.image_url !== '' && inc.image_url !== 'undefined') {
            modalImage.src = inc.image_url;
            modalImage.style.display = 'block';
            noImageDiv.style.display = 'none';
            console.log('Image loaded for incident:', inc.id);
            
            // Handle image load error
            modalImage.onload = function() {
                console.log('Image loaded successfully');
            };
            modalImage.onerror = function() {
                console.error('Image failed to load:', inc.image_url);
                modalImage.style.display = 'none';
                noImageDiv.style.display = 'flex';
                noImageDiv.style.flexDirection = 'column';
                noImageDiv.style.alignItems = 'center';
                noImageDiv.innerHTML = `
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <p>Image failed to load</p>
                    <p style="font-size: 11px;">The image URL may be invalid or corrupted</p>
                `;
            };
        } else {
            modalImage.style.display = 'none';
            noImageDiv.style.display = 'flex';
            noImageDiv.style.flexDirection = 'column';
            noImageDiv.style.alignItems = 'center';
            noImageDiv.innerHTML = `
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                </svg>
                <p>No image attached</p>
                <p style="font-size: 11px;">Student did not upload an image</p>
            `;
        }
    }
    
    const modal = document.getElementById('incidentModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
};

window.closeModal = function() { 
    const modal = document.getElementById('incidentModal');
    if (modal) modal.style.display = 'none';
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
        showNotification('Status updated', 'success'); 
        // Also trigger storage event for student dashboard to refresh
        window.dispatchEvent(new StorageEvent('storage', { key: 'campus_care_reports' }));
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

// Add modal image styles
function addModalImageStyles() {
    const modalImageContainer = document.querySelector('.modal-image-section');
    if (modalImageContainer) return;
    
    const style = document.createElement('style');
    style.id = 'modal-image-styles';
    style.textContent = `
        .modal-image-section {
            background: #F1F5F9;
            border-radius: 12px;
            min-height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        .modal-image-section img {
            max-width: 100%;
            max-height: 250px;
            object-fit: contain;
        }
        .no-image {
            text-align: center;
            color: #94A3B8;
            padding: 20px;
        }
        .no-image svg {
            width: 48px;
            height: 48px;
            margin-bottom: 8px;
            opacity: 0.5;
        }
    `;
    document.head.appendChild(style);
}

// Add modal HTML if not exists
function ensureModalHasImageSection() {
    const modal = document.getElementById('incidentModal');
    if (!modal) return;
    
    const modalBody = modal.querySelector('.modal-body');
    if (modalBody && !modalBody.querySelector('.modal-image-section')) {
        const imageSection = document.createElement('div');
        imageSection.className = 'modal-image-section';
        imageSection.innerHTML = `
            <img id="modalImage" src="" alt="Incident Image" style="max-width:100%; max-height:250px; display:none;">
            <div id="noImage" class="no-image">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                </svg>
                <p>No image attached</p>
            </div>
        `;
        modalBody.insertBefore(imageSection, modalBody.firstChild);
    }
}

loadIncidents();
setupFilters();
setupNav();
addModalImageStyles();
ensureModalHasImageSection();

window.addEventListener('storage', (e) => { 
    if (e.key === 'campus_care_reports') { 
        loadIncidents(); 
        showNotification('New reports received', 'info'); 
    } 
});