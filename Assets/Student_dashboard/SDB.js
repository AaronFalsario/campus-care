// Student Dashboard JavaScript
const STORAGE_KEY = 'campus_care_reports';
let currentStudent = null;
let currentFilter = 'all';
let allIncidents = [];
let viewMode = 'my';
let refreshInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    init();
    startAutoRefresh();
});

function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        loadIncidents();
        console.log('Auto-refreshed - checking for status updates');
    }, 3000);
}

window.addEventListener('beforeunload', () => {
    if (refreshInterval) clearInterval(refreshInterval);
});

// ========== DATABASE & AUTHENTICATION ==========
function checkAuth() {
    const stored = localStorage.getItem('currentStudent');
    if (!stored) {
        window.location.href = '/Assets/Student Authentication/Student.html';
        return false;
    }
    try {
        currentStudent = JSON.parse(stored);
        if (!currentStudent.name || !currentStudent.studentId) {
            window.location.href = '/Assets/Student Authentication/Student.html';
            return false;
        }
    } catch(e) {
        window.location.href = '/Assets/Student Authentication/Student.html';
        return false;
    }
    return true;
}

function loadIncidents() {
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
            reporter: r.studentName,
            student_id: r.studentId || r.studentIdNumber || r.student_id || r.studentID,
            description: r.description || 'No description provided',
            timestamp: new Date(r.timestamp),
            image_url: r.imageUrl || r.image_url || null
        }));
    } else {
        allIncidents = [];
    }
    
    loadAndDisplayReports();
    updateStats();
}

// Get reports based on view mode
function getReportsToDisplay() {
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
    const isYourReport = String(report.student_id) === String(currentStudent?.studentId);
    
    // Status badge class
    let statusClass = '';
    if (report.status === 'pending') statusClass = 'pending';
    else if (report.status === 'in-progress') statusClass = 'progress';
    else if (report.status === 'resolved') statusClass = 'resolved';
    
    return `
        <div class="incident-card" onclick="viewIncident(${report.id})">
            <div class="card-header">
                <div class="incident-title">${escapeHtml(report.name)}</div>
                <div class="incident-badges">
                    <span class="badge ${report.category}">${cat.label}</span>
                    <span class="badge ${report.priority}">${pri.label}</span>
                    <span class="badge ${statusClass}">${stat.label}</span>
                    ${isYourReport ? '<span class="badge your">Your Report</span>' : '<span class="badge other">By: ' + escapeHtml(report.reporter || 'Student') + '</span>'}
                </div>
            </div>
            <div class="incident-location">📍 ${escapeHtml(report.location)}</div>
            <div class="card-footer">
                <div class="reporter-info">
                    👤 ${isYourReport ? 'Reported by you' : `Reported by: ${escapeHtml(report.reporter || 'Another Student')}`}
                </div>
                <div class="timestamp">${timeAgo}</div>
            </div>
        </div>
    `;
}

// ========== STATS FUNCTION - NO ANIMATION ==========
function updateStats() {
    // Get ONLY the current student's reports
    const myReports = allIncidents.filter(inc => String(inc.student_id) === String(currentStudent?.studentId));
    
    const total = myReports.length;
    const pendingCount = myReports.filter(r => r.status === 'pending').length;
    const inProgressCount = myReports.filter(r => r.status === 'in-progress').length;
    const resolvedCount = myReports.filter(r => r.status === 'resolved').length;
    const totalCampus = allIncidents.length;
    
    // Update DOM elements - NO ANIMATION
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

// ========== VIEW MODE TOGGLE ==========
function toggleViewMode() {
    viewMode = viewMode === 'all' ? 'my' : 'all';
    const toggleBtn = document.getElementById('viewModeToggle');
    if (toggleBtn) {
        toggleBtn.textContent = viewMode === 'my' ? '🌐 View All Reports' : '📋 View My Reports';
    }
    loadAndDisplayReports();
}

window.viewIncident = function(id) {
    const inc = allIncidents.find(i => i.id === id);
    if (!inc) return;
    
    let modal = document.getElementById('incidentModal');
    if (!modal) {
        createModal();
        modal = document.getElementById('incidentModal');
    }
    
    const isYourReport = String(inc.student_id) === String(currentStudent?.studentId);
    
    document.getElementById('modalTitle').innerText = inc.name;
    document.getElementById('modalLocation').innerText = inc.location;
    document.getElementById('modalCategory').innerHTML = `<span class="badge ${inc.category}">${inc.category}</span>`;
    document.getElementById('modalPriority').innerHTML = `<span class="badge ${inc.priority}">${inc.priority}</span>`;
    
    // Status display
    let statusClass = '';
    if (inc.status === 'pending') statusClass = 'pending';
    else if (inc.status === 'in-progress') statusClass = 'progress';
    else if (inc.status === 'resolved') statusClass = 'resolved';
    
    let statusLabel = inc.status === 'in-progress' ? 'In Progress' : inc.status.charAt(0).toUpperCase() + inc.status.slice(1);
    document.getElementById('modalStatus').innerHTML = `<span class="badge ${statusClass}">${statusLabel}</span>`;
    document.getElementById('modalDescription').innerText = inc.description;
    document.getElementById('modalDate').innerText = new Date(inc.timestamp).toLocaleString();
    
    const modalReporter = document.getElementById('modalReporter');
    if (modalReporter) {
        modalReporter.innerHTML = `<span class="badge other">${isYourReport ? 'You' : escapeHtml(inc.reporter || 'Another Student')}</span>`;
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
                    <div class="modal-row"><div class="modal-label">Description</div><div class="modal-value">📄 <span id="modalDescription"></span></div></div>
                    <div class="modal-row"><div class="modal-label">Date</div><div class="modal-value" id="modalDate"></div></div>
                </div>
                <div class="modal-footer"><button class="modal-btn modal-btn-primary" onclick="closeModal()">Close</button></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    if (!document.getElementById('modal-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .modal-overlay {
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.5); z-index: 1000; display: flex;
                align-items: center; justify-content: center; opacity: 0;
                visibility: hidden; transition: all 0.3s; backdrop-filter: blur(4px);
            }
            .modal-overlay.active { opacity: 1; visibility: visible; }
            .modal-container {
                background: white; border-radius: 24px; width: 90%; max-width: 500px;
                max-height: 80vh; overflow-y: auto; transform: scale(0.9); transition: transform 0.3s;
            }
            .modal-overlay.active .modal-container { transform: scale(1); }
            .modal-header {
                padding: 20px 24px; background: #2563EB; color: white;
                border-radius: 24px 24px 0 0; display: flex; justify-content: space-between;
            }
            .modal-close { background: none; border: none; color: white; font-size: 24px; cursor: pointer; }
            .modal-body { padding: 24px; }
            .modal-row { margin-bottom: 16px; display: flex; flex-wrap: wrap; }
            .modal-label { width: 100px; font-weight: 600; color: #64748B; font-size: 12px; text-transform: uppercase; }
            .modal-value { flex: 1; font-size: 14px; color: #1E293B; }
            .modal-footer { padding: 16px 24px; display: flex; justify-content: flex-end; border-top: 1px solid #E2E8F0; }
            .modal-btn { padding: 8px 20px; border-radius: 30px; border: none; cursor: pointer; font-family: inherit; }
            .modal-btn-primary { background: #2368AF; color: white; }
            .badge.other { background: #E2E8F0; color: #475569; }
            .badge.progress { background: #EFF6FF; color: #2563EB; }
            .badge.resolved { background: #D1FAE5; color: #059669; }
            .badge.pending { background: #FEF3C7; color: #D97706; }
        `;
        document.head.appendChild(style);
    }
}

function getReports() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    return [];
}

function saveReports(reports) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

// ========== DRAWER & UI FUNCTIONS ==========
function loadStudentFromLogin() {
    if (!currentStudent) return;
    
    const studentNameElements = document.querySelectorAll('#studentName, .drawer-name');
    studentNameElements.forEach(el => {
        if (el) el.textContent = currentStudent.name;
    });
    
    const welcomeHeader = document.querySelector('.hero-title');
    if (welcomeHeader) {
        const firstName = currentStudent.name.split(' ')[0];
        welcomeHeader.innerHTML = `Welcome back, ${firstName}! 👋`;
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

function transformReportButtonToStudentButton() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;
    
    const reportBtn = topbar.querySelector('.report-btn');
    if (reportBtn) {
        const newBtn = reportBtn.cloneNode(true);
        reportBtn.parentNode.replaceChild(newBtn, reportBtn);
        
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.setItem('currentStudent', JSON.stringify(currentStudent));
            window.location.href = '/Assets/Student_reporting/report.html';
        });
    }
}

function setupDrawerReportButton() {
    const reportNavItem = document.querySelector('.drawer-item[data-page="report"]');
    if (reportNavItem) {
        const newItem = reportNavItem.cloneNode(true);
        reportNavItem.parentNode.replaceChild(newItem, reportNavItem);
        
        newItem.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.closeDrawer) window.closeDrawer();
            localStorage.setItem('currentStudent', JSON.stringify(currentStudent));
            window.location.href = '/Assets/Student_reporting/report.html';
        });
    }
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
        toggleBtn.innerHTML = '🌐 View All Reports';
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
                    window.location.href = '/Assets/Student Authentication/Student.html';
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
        .badge.other { background: #E2E8F0; color: #475569; }
        .filter-chip.active { background: #2563EB; color: white; }
        #viewModeToggle { transition: all 0.2s ease; }
    `;
    document.head.appendChild(style);
}

function setupUI() {
    initializeDrawer();
    addDrawerStyles();
    transformReportButtonToStudentButton();
    setupDrawerReportButton();
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

function init() {
    if (!checkAuth()) return;
    
    loadStudentFromLogin();
    loadIncidents();
    setupUI();
    
    // Listen for localStorage changes (when admin updates status in another tab)
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
            console.log('Storage event detected - reloading incidents');
            loadIncidents();
            showNotification('📢 Your report status has been updated!');
        }
    });
}

// Export functions
window.getReports = getReports;
window.saveReports = saveReports;