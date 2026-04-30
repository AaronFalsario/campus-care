// Admin Dashboard JavaScript
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase configuration
const supabaseUrl = 'https://opjyksksnccurdwyskiu.supabase.co'
const supabaseKey = 'sb_publishable_l7mKNQVJ6WesiTM4GJCxQg_oXxTN3it'
const supabase = createClient(supabaseUrl, supabaseKey)

let allIncidents = [];
let currentFilter = 'all';
let incidentChart = null;
let currentIncidentId = null;
let currentAdmin = null;
let realtimeSubscription = null;
let isInitialLoad = true;

// FIX: Flag to prevent storage-event-triggered reloads from looping
let isSavingToStorage = false;

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

// ============ LOAD INCIDENTS FROM SUPABASE ============
async function loadIncidentsFromSupabase() {
    try {
        console.log('Loading incidents from Supabase...');
        
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
                reporter: r.student_name || r.studentName,
                student_id: r.student_id_number,
                description: r.description || 'No description provided',
                image_url: r.image_url || null,
                timestamp: new Date(r.created_at),
                resolved_at: r.resolved_at || null,
                is_anonymous: r.is_anonymous
            }));
            
            // FIX: Use the guarded save so it doesn't trigger the storage event loop
            saveToLocalStorage();
            console.log(`✅ Loaded ${allIncidents.length} incidents from Supabase`);
        } else {
            allIncidents = [];
            console.log('No incidents found in Supabase');
        }
        
        await checkAndDeleteOldResolved();
        updateAll();
        
    } catch (error) {
        console.error('Error loading from Supabase:', error);
        loadFromLocalStorage();
    }
}

async function loadFromLocalStorage() {
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
            resolved_at: r.resolved_at || null,
            is_anonymous: r.is_anonymous
        }));
    } else {
        allIncidents = [];
    }
    await checkAndDeleteOldResolved();
    updateAll();
}

// ============ REAL-TIME SUBSCRIPTION ============
function setupRealtimeSubscription() {
    if (realtimeSubscription) return;
    
    console.log('Setting up real-time subscription for incident table...');
    
    realtimeSubscription = supabase
        .channel('incident-changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'incident' },
            (payload) => {
                console.log('Real-time update received:', payload.eventType);
                // FIX: Real-time already handles sync — no need for extra reloads elsewhere
                loadIncidentsFromSupabase();
                
                if (!isInitialLoad && payload.eventType === 'INSERT') {
                    showNotification('📢 New incident report received!', 'info');
                }
            }
        )
        .subscribe();
    
    setTimeout(() => {
        isInitialLoad = false;
    }, 3000);
}

// ============ UPDATE INCIDENT STATUS IN SUPABASE ============
async function updateIncidentStatus(incidentId, newStatus, resolvedAt = null) {
    try {
        const updateData = {
            status: newStatus,
            updated_at: new Date().toISOString()
        };
        
        if (resolvedAt) {
            updateData.resolved_at = resolvedAt;
        }
        
        const { error } = await supabase
            .from('incident')
            .update(updateData)
            .eq('id', incidentId);
        
        if (error) {
            console.error('Error updating status in Supabase:', error);
            return false;
        }
        
        console.log('✅ Status updated in Supabase:', newStatus);
        return true;
        
    } catch (error) {
        console.error('Error updating status:', error);
        return false;
    }
}

// FIX: Guard saveToLocalStorage with a flag so it doesn't trigger the storage event listener loop
function saveToLocalStorage() {
    isSavingToStorage = true;
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
        resolved_at: i.resolved_at,
        is_anonymous: i.is_anonymous
    }));
    localStorage.setItem('campus_care_reports', JSON.stringify(toStore));
    // Reset the flag after the browser has had a chance to fire the storage event
    setTimeout(() => { isSavingToStorage = false; }, 0);
}

// ============ AUTO-DELETE FUNCTIONS ============
// FIX: Made async and properly awaits each Supabase delete so the row is
// actually removed from the DB (and the student dashboard's real-time
// subscription picks up the DELETE event and removes it from the UI).
async function checkAndDeleteOldResolved() {
    const now = new Date();

    const toDelete = [];
    const toKeep = allIncidents.filter(incident => {
        if (incident.status !== 'resolved') return true;

        const resolvedTime = new Date(incident.resolved_at || incident.timestamp);
        const hoursSinceResolved = (now - resolvedTime) / (1000 * 60 * 60);

        if (hoursSinceResolved < RESOLVED_RETENTION_HOURS) {
            return true;
        } else {
            toDelete.push(incident);
            return false;
        }
    });

    if (toDelete.length === 0) return;

    for (const incident of toDelete) {
        console.log(`Deleting old resolved incident: ${incident.name}`);
        const { error } = await supabase
            .from('incident')
            .delete()
            .eq('id', incident.id);

        if (error) {
            console.error(`Failed to delete incident ${incident.id}:`, error);
            // Put it back so we retry next cycle instead of silently losing it
            toKeep.push(incident);
        } else {
            console.log(`Deleted incident ${incident.id} from Supabase`);
        }
    }

    allIncidents = toKeep;
    saveToLocalStorage();
}

function startAutoCleanupScheduler() {
    checkAndDeleteOldResolved(); // fire-and-forget on startup is fine
    setInterval(async () => {
        await checkAndDeleteOldResolved();
        updateAll();
    }, 3600000);
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
            <td>${escape(inc.reporter)}</td>
            <td>${inc.student_id}</td>
            <td>${getTimeAgo(inc.timestamp)}</td>
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
    if (modalReporter) modalReporter.innerText = inc.is_anonymous === 'true' ? 'Anonymous Reporter' : inc.reporter;
    if (modalStudentId) modalStudentId.innerText = inc.is_anonymous === 'true' ? 'Hidden' : inc.student_id;
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
    
    // Inject or update the delete button in the modal footer
    const modalFooter = document.querySelector('#incidentModal .modal-footer, #incidentModal [class*="footer"]');
    if (modalFooter) {
        // Remove any existing delete btn to avoid duplicates
        const existing = document.getElementById('modalDeleteBtn');
        if (existing) existing.remove();

        const deleteBtn = document.createElement('button');
        deleteBtn.id = 'modalDeleteBtn';
        deleteBtn.innerHTML = '🗑️ Delete';
        deleteBtn.onclick = () => deleteIncident(id);
        deleteBtn.style.cssText = `
            background: #DC2626;
            color: white;
            border: none;
            padding: 8px 18px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-family: inherit;
            margin-right: auto;
        `;
        modalFooter.insertBefore(deleteBtn, modalFooter.firstChild);
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

// ============ DELETE INCIDENT ============
window.deleteIncident = async function(id) {
    const incident = allIncidents.find(i => i.id === id);
    if (!incident) return;

    const confirmed = confirm(`Are you sure you want to permanently delete this incident?\n\n"${incident.name}"\n\nThis cannot be undone.`);
    if (!confirmed) return;

    // Disable delete button to prevent double-click
    const deleteBtn = document.getElementById('modalDeleteBtn');
    if (deleteBtn) { deleteBtn.disabled = true; deleteBtn.textContent = 'Deleting...'; }

    const { error } = await supabase
        .from('incident')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Delete failed:', error);
        showNotification('❌ Failed to delete incident: ' + (error.message || 'Unknown error'), 'error');
        if (deleteBtn) { deleteBtn.disabled = false; deleteBtn.textContent = '🗑️ Delete'; }
        return;
    }

    console.log('✅ Incident deleted from Supabase:', id);
    showNotification('✓ Incident permanently deleted.');

    // Remove from local array and update UI immediately
    allIncidents = allIncidents.filter(i => i.id !== id);
    saveToLocalStorage();
    updateAll();
    closeModal();
};

// ============ FIXED: SAVE STATUS — removed redundant reload that caused the loop ============
window.saveStatus = async function() {
    if (!currentIncidentId) return;
    
    const newStatus = document.getElementById('modalStatus').value;
    const incident = allIncidents.find(i => i.id === currentIncidentId);
    
    if (!incident) return;
    
    if (newStatus !== incident.status) {
        const oldStatus = incident.status;
        let resolvedAt = null;
        
        if (newStatus === 'resolved' && oldStatus !== 'resolved') {
            resolvedAt = new Date().toISOString();
            showNotification(`✓ Incident marked as RESOLVED. It will be automatically deleted after ${RESOLVED_RETENTION_HOURS} hours.`);
        } else if (newStatus !== 'resolved' && oldStatus === 'resolved') {
            resolvedAt = null;
            showNotification(`✓ Status updated to ${newStatus}`);
        } else {
            showNotification(`✓ Status updated to ${newStatus}`);
        }
        
        // Update local array
        incident.status = newStatus;
        incident.resolved_at = resolvedAt;
        
        // Update in Supabase
        const success = await updateIncidentStatus(currentIncidentId, newStatus, resolvedAt);
        
        if (success) {
            // Save to localStorage backup
            saveToLocalStorage();
            // Update UI immediately from local data — real-time subscription will confirm sync
            updateAll();
            // FIX: Removed the setTimeout reload here — it was causing the infinite loop.
            // The Supabase real-time subscription already triggers a fresh load on any DB change.
        } else {
            showNotification('❌ Failed to update status. Please try again.', 'error');
            // Revert local change
            incident.status = oldStatus;
            incident.resolved_at = null;
            updateAll();
        }
    }
    
    closeModal();
};

function getIcon(cat) { return { security:'⚠️', maintenance:'🔧', janitorial:'🧹', facilities:'🏢' }[cat] || '📋'; }
function getCategoryColor(cat) { return { security:'#DC2626', maintenance:'#2563EB', janitorial:'#1D9E75', facilities:'#D97706' }[cat] || '#6B7280'; }
function getTimeAgo(date) { const h = Math.floor((Date.now() - new Date(date)) / 3600000); if (h < 1) return 'Just now'; if (h < 24) return `${h}h ago`; return `${Math.floor(h/24)}d ago`; }
function escape(t) { if (!t) return ''; return t.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m])); }
function showNotification(msg, type = 'success') { 
    const n = document.createElement('div'); 
    n.className = 'notification'; 
    n.textContent = msg; 
    n.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'error' ? '#DC2626' : '#10B981'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(n); 
    setTimeout(() => n.remove(), 3000); 
}

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

// Bottom Navigation JavaScript for Admin Dashboard
(function() {
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    
    function getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('Admin.html') || path.includes('dashboard')) return 'dashboard';
        if (path.includes('incident')) return 'incidents';
        if (path.includes('user_page')) return 'users';
        if (path.includes('setting')) return 'settings';
        return 'dashboard';
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
})();

// ============ INITIALIZATION ============
async function init() {
    loadAdminToDrawer();
    await loadIncidentsFromSupabase();
    setupEvents();
    startAutoCleanupScheduler();
    setupRealtimeSubscription();

    window.addEventListener('storage', (e) => { 
        if (e.key === 'campus_care_reports' && !isSavingToStorage) { 
            console.log('Storage event from another tab - reloading incidents');
            loadIncidentsFromSupabase(); 
        } 
    });
}

// Start the dashboard
init();