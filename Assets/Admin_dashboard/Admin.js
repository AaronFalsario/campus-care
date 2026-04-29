let allIncidents = [];
let currentFilter = 'all';
let incidentChart = null;
let currentIncidentId = null;
let currentAdmin = null;

// AUTO-DELETE RESOLVED INCIDENTS AFTER 24 HOURS
const RESOLVED_RETENTION_HOURS = 24;

// ============ LOAD ADMIN INFO TO DRAWER ============
function loadAdminToDrawer() {
    try {
        const storedAdmin = localStorage.getItem('currentAdmin');
        const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
        
        if (!storedAdmin || isLoggedIn !== 'true') {
            return;
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
        const drawerName = document.getElementById('drawerAdminName');
        const drawerRole = document.getElementById('drawerAdminRole');
        const drawerInitials = document.getElementById('drawerInitials');
        const topAdminName = document.getElementById('topAdminName');
        const welcomeMessage = document.getElementById('welcomeMessage');
        
        if (drawerName) drawerName.textContent = adminName;
        if (drawerRole) drawerRole.textContent = currentAdmin.role || 'Campus Care Admin';
        if (drawerInitials) drawerInitials.textContent = adminInitials;
        if (topAdminName) topAdminName.textContent = adminName.split(' ')[0] || 'Admin';
        if (welcomeMessage) welcomeMessage.textContent = `Welcome back, ${adminName}! Manage incidents and monitor campus maintenance`;
        
    } catch (error) {
        console.error('Error loading admin to drawer:', error);
    }
}

function checkAndDeleteOldResolved() {
    const now = new Date();
    let hasChanges = false;
    
    allIncidents = allIncidents.filter(incident => {
        if (incident.status !== 'resolved') return true;
        
        const resolvedTime = new Date(incident.resolved_at || incident.timestamp);
        const hoursSinceResolved = (now - resolvedTime) / (1000 * 60 * 60);
        
        if (hoursSinceResolved < RESOLVED_RETENTION_HOURS) {
            return true;
        } else {
            hasChanges = true;
            console.log(`Deleting old resolved incident: ${incident.name}`);
            return false;
        }
    });
    
    if (hasChanges) saveToLocalStorage();
}

function startAutoCleanupScheduler() {
    checkAndDeleteOldResolved();
    setInterval(() => {
        checkAndDeleteOldResolved();
        updateAll();
    }, 3600000);
}

function loadData() {
    const stored = localStorage.getItem('campus_care_reports');
    if (stored && stored !== '[]') {
        const reports = JSON.parse(stored);
        allIncidents = reports.map(r => ({
            id: r.id,
            name: r.title || r.name,
            location: r.location,
            category: r.category || 'maintenance',
            priority: r.priority || 'medium',
            status: r.status || 'pending',
            reporter: r.studentName || r.reporter || 'Student',
            student_id: r.studentIdNumber || r.student_id_number || 'N/A',
            description: r.description || 'No description provided',
            image_url: r.imageUrl || r.image_url || null,
            timestamp: new Date(r.timestamp),
            resolved_at: r.resolved_at || null
        }));
    } else {
        allIncidents = [];
    }
    
    checkAndDeleteOldResolved();
    updateAll();
}

function saveToLocalStorage() {
    const toStore = allIncidents.map(i => ({
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
        studentIdNumber: i.student_id,
        resolved_at: i.resolved_at
    }));
    localStorage.setItem('campus_care_reports', JSON.stringify(toStore));
}

function updateAll() { 
    updateStats(); 
    updateChart(); 
    updateTopCategories(); 
    renderIncidents(); 
    renderMobileCards(); 
}

function updateStats() {
    const total = allIncidents.length;
    const active = allIncidents.filter(i => i.status !== 'resolved').length;
    const resolved = allIncidents.filter(i => i.status === 'resolved').length;
    const rate = total ? Math.round((resolved / total) * 100) : 0;
    
    const totalReportsEl = document.getElementById('totalReports');
    const activeReportsEl = document.getElementById('activeReports');
    const resolvedRateEl = document.getElementById('resolvedRate');
    const avgResolutionEl = document.getElementById('avgResolution');
    
    if (totalReportsEl) totalReportsEl.textContent = total;
    if (activeReportsEl) activeReportsEl.textContent = active;
    if (resolvedRateEl) resolvedRateEl.textContent = rate + '%';
    if (avgResolutionEl) avgResolutionEl.textContent = total ? '42h' : '—';
    
    const cats = { security:0, maintenance:0, janitorial:0, facilities:0 };
    allIncidents.forEach(i => { if(cats[i.category] !== undefined) cats[i.category]++; });
    
    const securityEl = document.getElementById('securityCount');
    const maintenanceEl = document.getElementById('maintenanceCount');
    const janitorialEl = document.getElementById('janitorialCount');
    const facilitiesEl = document.getElementById('facilitiesCount');
    
    if (securityEl) securityEl.textContent = cats.security;
    if (maintenanceEl) maintenanceEl.textContent = cats.maintenance;
    if (janitorialEl) janitorialEl.textContent = cats.janitorial;
    if (facilitiesEl) facilitiesEl.textContent = cats.facilities;
}

function updateTopCategories() {
    const cats = { security:0, maintenance:0, janitorial:0, facilities:0 };
    allIncidents.forEach(i => { if(cats[i.category] !== undefined) cats[i.category]++; });
    
    const topSecurity = document.getElementById('topSecurity');
    const topMaintenance = document.getElementById('topMaintenance');
    const topJanitorial = document.getElementById('topJanitorial');
    const topFacilities = document.getElementById('topFacilities');
    
    if (topSecurity) topSecurity.textContent = cats.security;
    if (topMaintenance) topMaintenance.textContent = cats.maintenance;
    if (topJanitorial) topJanitorial.textContent = cats.janitorial;
    if (topFacilities) topFacilities.textContent = cats.facilities;
}

function updateChart() {
    const months = [];
    const monthlyData = {};
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleString('default', { month: 'short' });
        months.push(monthName);
        monthlyData[monthName] = 0;
    }
    allIncidents.forEach(inc => {
        const monthName = new Date(inc.timestamp).toLocaleString('default', { month: 'short' });
        if (monthlyData[monthName] !== undefined) monthlyData[monthName]++;
    });
    const chartData = months.map(m => monthlyData[m] || 0);
    const ctx = document.getElementById('incidentChart');
    if (ctx) {
        const canvasCtx = ctx.getContext('2d');
        if (incidentChart) incidentChart.destroy();
        incidentChart = new Chart(canvasCtx, {
            type: 'line',
            data: { labels: months, datasets: [{ label: 'Incidents', data: chartData, borderColor: '#1D9E75', backgroundColor: 'rgba(29,158,117,0.1)', borderWidth: 2, fill: true, tension: 0.3, pointBackgroundColor: '#1D9E75', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4 }] },
            options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#E4E1DB' }, ticks: { stepSize: 1 } }, x: { grid: { display: false } } } }
        });
    }
}

function getFiltered() {
    let filtered = [...allIncidents];
    if (currentFilter !== 'all') filtered = filtered.filter(i => i.status === currentFilter);
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function renderIncidents() {
    const tbody = document.getElementById('incidentsTableBody');
    if (!tbody) return;
    
    const filtered = getFiltered();
    if (filtered.length === 0) { 
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:60px;">📭 No incidents found</td></tr>`;
        return; 
    }
    tbody.innerHTML = filtered.map(inc => `
        <tr data-id="${inc.id}">
            <td><div class="inc-cell"><div class="inc-icon-sm" style="background:${getCategoryColor(inc.category)}20;color:${getCategoryColor(inc.category)}">${getIcon(inc.category)}</div><div><strong>${escape(inc.name)}</strong><br><span style="font-size:11px;color:var(--muted)">${escape(inc.location)}</span></div></div></td>
            <td><span class="badge b-${inc.category}">${inc.category}</span></td>
            <td><span class="badge b-${inc.priority}">${inc.priority}</span></td>
            <td><span class="badge b-${inc.status === 'in-progress' ? 'inprogress' : inc.status}">${inc.status}</span></td>
            <td>${escape(inc.reporter)}</span></td>
            <td>${inc.student_id}</span></td>
            <td>${getTimeAgo(inc.timestamp)}</span></td>
            <td><div class="action-btns"><button class="action-btn" onclick="openModal(${inc.id})">👁️</button></div></td>
        </tr>
    `).join('');
}

function renderMobileCards() {
    const container = document.getElementById('mobileCards');
    if (!container) return;
    
    const filtered = getFiltered();
    if (filtered.length === 0) { 
        container.innerHTML = `<div style="text-align:center;padding:40px;">📭 No incidents found</div>`; 
        return; 
    }
    container.innerHTML = filtered.map(inc => `
        <div class="m-card"><div class="m-card-top"><div class="inc-icon-sm" style="background:${getCategoryColor(inc.category)}20;color:${getCategoryColor(inc.category)}">${getIcon(inc.category)}</div><div><strong>${escape(inc.name)}</strong><div style="font-size:11px;color:var(--muted)">${escape(inc.location)}</div></div></div>
        <div class="m-card-body"><div><div class="m-field-label">Category</div><span class="badge b-${inc.category}">${inc.category}</span></div><div><div class="m-field-label">Priority</div><span class="badge b-${inc.priority}">${inc.priority}</span></div><div><div class="m-field-label">Status</div><span class="badge b-${inc.status === 'in-progress' ? 'inprogress' : inc.status}">${inc.status}</span></div><div><div class="m-field-label">Reporter</div>${escape(inc.reporter)}</div></div>
        <div class="m-card-footer"><div class="m-timestamp">${getTimeAgo(inc.timestamp)}</div><div class="action-btns"><button class="action-btn" onclick="openModal(${inc.id})">👁️</button></div></div></div>
    `).join('');
}

window.openModal = function(id) {
    const inc = allIncidents.find(i => i.id === id);
    if (!inc) return;
    currentIncidentId = id;
    
    const modalTitle = document.getElementById('modalTitle');
    const modalLocation = document.getElementById('modalLocation');
    const modalCategory = document.getElementById('modalCategory');
    const modalPriority = document.getElementById('modalPriority');
    const modalReporter = document.getElementById('modalReporter');
    const modalStudentId = document.getElementById('modalStudentId');
    const modalDate = document.getElementById('modalDate');
    const modalDescription = document.getElementById('modalDescription');
    const modalStatus = document.getElementById('modalStatus');
    
    if (modalTitle) modalTitle.innerText = inc.name;
    if (modalLocation) modalLocation.innerText = inc.location;
    if (modalCategory) modalCategory.innerHTML = `<span class="badge b-${inc.category}">${inc.category}</span>`;
    if (modalPriority) modalPriority.innerHTML = `<span class="badge b-${inc.priority}">${inc.priority}</span>`;
    if (modalReporter) modalReporter.innerText = inc.reporter;
    if (modalStudentId) modalStudentId.innerText = inc.student_id;
    if (modalDate) modalDate.innerText = new Date(inc.timestamp).toLocaleString();
    if (modalDescription) modalDescription.innerText = inc.description || 'No description provided';
    if (modalStatus) modalStatus.value = inc.status;
    
    const modalImage = document.getElementById('modalImage');
    const noImageDiv = document.getElementById('noImage');
    
    if (modalImage && noImageDiv) {
        if (inc.image_url && inc.image_url !== 'null' && inc.image_url !== '' && inc.image_url !== 'undefined') {
            modalImage.src = inc.image_url;
            modalImage.style.display = 'block';
            noImageDiv.style.display = 'none';
            
            modalImage.onload = function() {
                console.log('Image loaded successfully for incident:', inc.id);
            };
            modalImage.onerror = function() {
                console.error('Image failed to load for incident:', inc.id);
                modalImage.style.display = 'none';
                noImageDiv.style.display = 'flex';
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
    
    const deletionInfo = document.getElementById('modalDeletionInfo');
    if (deletionInfo) {
        if (inc.status === 'resolved' && inc.resolved_at) {
            const resolvedDate = new Date(inc.resolved_at);
            const deleteDate = new Date(resolvedDate.getTime() + (RESOLVED_RETENTION_HOURS * 60 * 60 * 1000));
            const hoursLeft = Math.max(0, Math.floor((deleteDate - new Date()) / (1000 * 60 * 60)));
            deletionInfo.style.display = 'flex';
            const infoValue = deletionInfo.querySelector('.info-value');
            if (infoValue) infoValue.innerHTML = `⚠️ Will be deleted in ${hoursLeft} hours`;
        } else {
            deletionInfo.style.display = 'none';
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

window.saveStatus = function() {
    if (!currentIncidentId) return;
    const newStatus = document.getElementById('modalStatus').value;
    const incident = allIncidents.find(i => i.id === currentIncidentId);
    if (incident && newStatus !== incident.status) {
        const oldStatus = incident.status;
        incident.status = newStatus;
        
        if (newStatus === 'resolved' && oldStatus !== 'resolved') {
            incident.resolved_at = new Date().toISOString();
            showNotification(`✓ Incident marked as RESOLVED. It will be automatically deleted after ${RESOLVED_RETENTION_HOURS} hours.`);
        }
        
        if (newStatus !== 'resolved' && oldStatus === 'resolved') {
            incident.resolved_at = null;
        }
        
        saveToLocalStorage();
        updateAll();
        showNotification(`✓ Status updated to ${newStatus}`);
    }
    closeModal();
};

function getIcon(cat) { return { security:'⚠️', maintenance:'🔧', janitorial:'🧹', facilities:'🏢' }[cat] || '📋'; }
function getCategoryColor(cat) { return { security:'#DC2626', maintenance:'#2563EB', janitorial:'#1D9E75', facilities:'#D97706' }[cat] || '#6B7280'; }
function getTimeAgo(date) { const h = Math.floor((Date.now() - new Date(date)) / 3600000); if (h < 1) return 'Just now'; if (h < 24) return `${h}h ago`; return `${Math.floor(h/24)}d ago`; }
function escape(t) { if (!t) return ''; return t.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m])); }
function showNotification(msg) { const n = document.createElement('div'); n.className = 'notification'; n.textContent = msg; document.body.appendChild(n); setTimeout(() => n.remove(), 3000); }

function setupEvents() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('overlay');
    const hamburger = document.getElementById('hamburger');
    const adminPill = document.getElementById('adminPill');
    if (hamburger) hamburger.onclick = () => { drawer.classList.toggle('open'); overlay.classList.toggle('open'); };
    if (overlay) overlay.onclick = () => { drawer.classList.remove('open'); overlay.classList.remove('open'); };
    if (adminPill) adminPill.onclick = () => { drawer.classList.toggle('open'); overlay.classList.toggle('open'); };
    
    document.querySelectorAll('.filter-chip').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderIncidents(); renderMobileCards();
        };
    });
    
    document.querySelectorAll('.drawer-item').forEach(item => {
        item.onclick = () => {
            const page = item.dataset.page;
            if (page === 'incidents') window.location.href = '/Assets/Admin_dashboard/incident/incident.html';
            else if (page === 'users') window.location.href = '/Assets/Admin_dashboard/user_page/user.html';
            else if (page === 'settings') window.location.href = '/Assets/Admin_dashboard/settings/setting.html';
            else if (page !== 'dashboard') window.location.href = '/Assets/Admin_dashboard/Admin.html';
            drawer.classList.remove('open'); overlay.classList.remove('open');
        };
    });
    
    // ============ FIXED LOGOUT BUTTON ============
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.onclick = () => { 
        if (confirm('Are you sure you want to logout?')) { 
            localStorage.removeItem('currentStudent'); 
            localStorage.removeItem('currentAdmin');
            localStorage.removeItem('isAdminLoggedIn');
            window.location.href = '/Assets/Landing_page/land.html'; 
        } 
    };
}
    
    document.addEventListener('click', (e) => { if (window.innerWidth <= 768 && drawer && hamburger && !drawer.contains(e.target) && !hamburger.contains(e.target)) { drawer.classList.remove('open'); overlay.classList.remove('open'); } });
}

// Initialize
loadAdminToDrawer();
loadData();
setupEvents();
startAutoCleanupScheduler();

window.addEventListener('storage', (e) => { 
    if (e.key === 'campus_care_reports') { 
        loadData(); 
        showNotification('Data updated'); 
    } 
});