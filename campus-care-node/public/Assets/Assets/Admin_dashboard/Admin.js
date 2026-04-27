const APP_STATE = {
    currentFilter: 'all',
    currentPage: 'dashboard',
    sortBy: 'date',
    searchQuery: '',
    incidents: [],
};

const INCIDENT_CATEGORIES = {
    security: { label: 'Security', color: '#DC2626', abbr: 'SEC' },
    maintenance: { label: 'Maintenance', color: '#2563EB', abbr: 'MNT' },
    janitorial: { label: 'Janitorial', color: '#1D9E75', abbr: 'JAN' },
    facilities: { label: 'Facilities', color: '#D97706', abbr: 'FAC' }, 
};

const PRIORITY_LEVELS = {
    low: { label: 'Low', value: 1, color: '#10B981' },
    medium: { label: 'Medium', value: 2, color: '#F59E0B' },
    high: { label: 'High', value: 3, color: '#DC2626' },
};

const STATUS_OPTIONS = {
    pending: { label: 'Pending', color: '#6B7280', icon: '⏱️' },
    'in-progress': { label: 'In Progress', color: '#3B82F6', icon: '⚙️' },
    resolved: { label: 'Resolved', color: '#10B981', icon: '✓' },
};

const DOM = {
    drawer: document.getElementById('drawer'),
    overlay: document.getElementById('overlay'),
    hamburger: document.getElementById('hamburger'),
    drawerClose: document.getElementById('drawerClose'),
    adminPill: document.getElementById('adminPill'),
    tableBody: document.querySelector('table tbody'),
    mobileCards: document.querySelector('.mobile-cards'),
    tabButtons: document.querySelectorAll('.tab-btn'),
    drawerItems: document.querySelectorAll('.drawer-item'),
    actionButtons: document.querySelectorAll('.action-btn'),
};

// Modal elements
let modal = null;
let modalOverlay = null;

// Create modal dynamically
function createModal() {
    // Check if modal already exists
    if (document.getElementById('incidentModal')) return;
    
    const modalHTML = `
        <div id="incidentModal" class="modal-overlay" style="display: none;">
            <div class="modal-container">
                <div class="modal-header">
                    <h3>Incident Details</h3>
                    <button class="modal-close-btn" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="modal-image-section">
                        <img id="modalImage" src="" alt="Incident Image">
                        <div id="noImage" class="no-image">No image attached</div>
                    </div>
                    <div class="modal-info-section">
                        <div class="info-row">
                            <span class="info-label">Title:</span>
                            <span id="modalTitle" class="info-value"></span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Location:</span>
                            <span id="modalLocation" class="info-value"></span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Category:</span>
                            <span id="modalCategory" class="info-value"></span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Priority:</span>
                            <span id="modalPriority" class="info-value"></span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Reporter:</span>
                            <span id="modalReporter" class="info-value"></span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Student ID:</span>
                            <span id="modalStudentId" class="info-value"></span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Date Reported:</span>
                            <span id="modalDate" class="info-value"></span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Description:</span>
                            <span id="modalDescription" class="info-value description-text"></span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Status:</span>
                            <select id="modalStatus" class="status-select">
                                <option value="pending">⏱️ Pending</option>
                                <option value="in-progress">⚙️ In Progress</option>
                                <option value="resolved">✓ Resolved</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-cancel-btn" onclick="closeModal()">Cancel</button>
                    <button class="modal-save-btn" onclick="saveStatus()">Save Changes</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add modal styles
    const modalStyles = document.createElement('style');
    modalStyles.textContent = `
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(3px);
        }
        .modal-container {
            background: white;
            border-radius: 20px;
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            animation: modalSlideIn 0.3s ease;
        }
        @keyframes modalSlideIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            border-bottom: 1px solid #E4E1DB;
            background: #1D9E75;
            color: white;
            border-radius: 20px 20px 0 0;
        }
        .modal-header h3 {
            font-size: 18px;
            font-weight: 600;
            margin: 0;
        }
        .modal-close-btn {
            background: none;
            border: none;
            font-size: 28px;
            cursor: pointer;
            color: white;
            transition: opacity 0.2s;
        }
        .modal-close-btn:hover {
            opacity: 0.7;
        }
        .modal-body {
            padding: 24px;
            display: grid;
            grid-template-columns: 1fr 1.5fr;
            gap: 24px;
        }
        .modal-image-section {
            background: #F9FAFB;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 250px;
        }
        .modal-image-section img {
            max-width: 100%;
            max-height: 250px;
            border-radius: 12px;
            object-fit: contain;
        }
        .no-image {
            color: #9CA3AF;
            font-size: 14px;
            text-align: center;
        }
        .info-row {
            margin-bottom: 14px;
            display: flex;
            flex-wrap: wrap;
        }
        .info-label {
            font-weight: 600;
            color: #6B7280;
            width: 110px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .info-value {
            flex: 1;
            color: #1F2937;
            font-size: 14px;
            word-break: break-word;
        }
        .description-text {
            line-height: 1.5;
            background: #F9FAFB;
            padding: 10px;
            border-radius: 8px;
            margin-top: 5px;
        }
        .status-select {
            padding: 8px 12px;
            border: 1px solid #E4E1DB;
            border-radius: 8px;
            font-family: inherit;
            font-size: 14px;
            cursor: pointer;
            width: auto;
            min-width: 150px;
        }
        .status-select:focus {
            outline: none;
            border-color: #1D9E75;
        }
        .modal-footer {
            padding: 16px 24px;
            border-top: 1px solid #E4E1DB;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }
        .modal-cancel-btn {
            padding: 8px 20px;
            background: #F3F4F6;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-family: inherit;
            font-size: 14px;
            transition: background 0.2s;
        }
        .modal-cancel-btn:hover {
            background: #E5E7EB;
        }
        .modal-save-btn {
            padding: 8px 20px;
            background: #1D9E75;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-family: inherit;
            font-size: 14px;
            font-weight: 500;
            transition: background 0.2s;
        }
        .modal-save-btn:hover {
            background: #085041;
        }
        @media (max-width: 640px) {
            .modal-body {
                grid-template-columns: 1fr;
                gap: 16px;
            }
            .info-label {
                width: 100px;
            }
        }
    `;
    document.head.appendChild(modalStyles);
}

// Current incident being edited
let currentIncidentId = null;

// Open modal with incident details
window.openModal = function(incidentId) {
    const incident = APP_STATE.incidents.find(inc => inc.id === incidentId);
    if (!incident) return;
    
    currentIncidentId = incidentId;
    
    // Create modal if not exists
    createModal();
    
    const modal = document.getElementById('incidentModal');
    if (!modal) return;
    
    // Set values
    document.getElementById('modalTitle').textContent = incident.name || 'Untitled';
    document.getElementById('modalLocation').textContent = incident.location || 'No location';
    
    const categoryInfo = INCIDENT_CATEGORIES[incident.category] || INCIDENT_CATEGORIES.maintenance;
    document.getElementById('modalCategory').innerHTML = `<span class="badge" style="background: ${categoryInfo.color}20; color: ${categoryInfo.color};">${categoryInfo.label}</span>`;
    
    const priorityInfo = PRIORITY_LEVELS[incident.priority] || PRIORITY_LEVELS.medium;
    document.getElementById('modalPriority').innerHTML = `<span class="badge" style="background: ${priorityInfo.color}20; color: ${priorityInfo.color};">${priorityInfo.label}</span>`;
    
    document.getElementById('modalReporter').textContent = incident.reporter || 'Anonymous';
    document.getElementById('modalStudentId').textContent = incident.student_id_number || 'N/A';
    document.getElementById('modalDate').textContent = new Date(incident.timestamp).toLocaleString();
    document.getElementById('modalDescription').textContent = incident.description || 'No description provided';
    
    // Set status dropdown
    const statusSelect = document.getElementById('modalStatus');
    statusSelect.value = incident.status || 'pending';
    
    // Set image
    const modalImage = document.getElementById('modalImage');
    const noImageDiv = document.getElementById('noImage');
    
    if (incident.image_url && incident.image_url !== 'null' && incident.image_url !== '') {
        modalImage.src = incident.image_url;
        modalImage.style.display = 'block';
        noImageDiv.style.display = 'none';
    } else {
        modalImage.style.display = 'none';
        noImageDiv.style.display = 'block';
        noImageDiv.textContent = '📷 No image attached';
    }
    
    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

// Close modal
window.closeModal = function() {
    const modal = document.getElementById('incidentModal');
    if (modal) {
        modal.style.display = 'none';
    }
    document.body.style.overflow = '';
    currentIncidentId = null;
};

// Save status only
window.saveStatus = function() {
    if (!currentIncidentId) return;
    
    const newStatus = document.getElementById('modalStatus').value;
    const incident = APP_STATE.incidents.find(inc => inc.id === currentIncidentId);
    
    if (incident && newStatus !== incident.status) {
        incident.status = newStatus;
        saveIncidents();
        renderIncidents();
        showNotification(`✓ Status updated to ${newStatus}`, 'success');
    }
    
    closeModal();
};

function initializeApp() {
    loadIncidents();
    setupEventListeners();
    renderIncidents();
    updateStats();

    window.addEventListener('storage', (e) => {
        if (e.key === 'campus_care_reports') {
            loadIncidents();
            renderIncidents();
            updateStats();
            showNotification('New report received from student', 'info');
        }
    });
}

function loadIncidents() {
    const stored = localStorage.getItem('campus_care_reports');
    
    if (stored) {
        const studentReports = JSON.parse(stored);
        APP_STATE.incidents = studentReports.map(report => ({
            id: report.id,
            name: report.title,
            location: report.location,
            category: report.category,
            priority: report.priority || 'medium',
            status: report.status || 'pending',
            reporter: report.studentName || 'Student',
            description: report.description || '',
            timestamp: new Date(report.timestamp),
            image_url: report.imageUrl || null,
            student_id_number: report.studentIdNumber || report.student_id_number || null,
            aiCategory: report.aiCategory,
            aiConfidence: report.aiConfidence
        }));
    } else {
        APP_STATE.incidents = [];
        localStorage.setItem('campus_care_reports', JSON.stringify([]));
    }
    
    saveIncidents();
}

function saveIncidents() {
    const reportsToSave = APP_STATE.incidents.map(inc => ({
        id: inc.id,
        title: inc.name,
        location: inc.location,
        category: inc.category,
        priority: inc.priority,
        status: inc.status,
        studentName: inc.reporter,
        description: inc.description,
        timestamp: inc.timestamp,
        imageUrl: inc.image_url,
        studentIdNumber: inc.student_id_number,
        aiCategory: inc.aiCategory,
        aiConfidence: inc.aiConfidence
    }));
    localStorage.setItem('campus_care_reports', JSON.stringify(reportsToSave));
}

function openDrawer() {
    DOM.drawer.classList.add('open');
    DOM.overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeDrawer() {
    DOM.drawer.classList.remove('open');
    DOM.overlay.classList.remove('open');
    document.body.style.overflow = '';
}

function navigateToPage(page) {
    APP_STATE.currentPage = page;
    console.log(`Navigating to: ${page}`);
    
    switch(page) {
        case 'dashboard':
            window.location.href = '/Assets/Admin_dashboard/admin.html';
            break;
        case 'incidents':
            window.location.href = '/Assets/Admin_dashboard/admin.html';
            break;
        case 'users':
            window.location.href = '/Assets/Admin_dashboard/user_page/user.html';
            break;
        case 'settings':
            showNotification('Settings page coming soon', 'info');
            break;
        case 'reports':
            showNotification('Reports page coming soon', 'info');
            break;
        default:
            console.log('Unknown page:', page);
    }
    
    closeDrawer();
}

function setupEventListeners() {
    if (DOM.hamburger) DOM.hamburger.addEventListener('click', openDrawer);
    if (DOM.drawerClose) DOM.drawerClose.addEventListener('click', closeDrawer);
    if (DOM.overlay) DOM.overlay.addEventListener('click', closeDrawer);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDrawer();
    });

    if (DOM.adminPill) {
        DOM.adminPill.addEventListener('click', () => {
            openDrawer();
        });
    }

    DOM.drawerItems.forEach((item) => {
        item.addEventListener('click', function() {
            DOM.drawerItems.forEach((i) => i.classList.remove('active'));
            this.classList.add('active');
            const page = this.getAttribute('data-page');
            navigateToPage(page);
        });
    });

    DOM.tabButtons.forEach((button) => {
        button.addEventListener('click', function() {
            DOM.tabButtons.forEach((b) => b.classList.remove('active'));
            this.classList.add('active');
            APP_STATE.currentFilter = this.getAttribute('data-filter');
            renderIncidents();
        });
    });

    setupActionButtons();
    
    const logoutBtn = document.querySelector('.drawer-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function setupActionButtons() {
    document.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.action-btn:not(.del)');
        const deleteBtn = e.target.closest('.action-btn.del');
        if (editBtn) {
            const incidentId = parseInt(editBtn.closest('tr, article')?.getAttribute('data-incident-id'));
            if (incidentId) openModal(incidentId);
        }
        if (deleteBtn) {
            const incidentId = parseInt(deleteBtn.closest('tr, article')?.getAttribute('data-incident-id'));
            if (incidentId) handleDeleteIncident(incidentId);
        }
    });
}

function getFilteredIncidents() {
    let filtered = APP_STATE.incidents;

    if (APP_STATE.currentFilter !== 'all') {
        filtered = filtered.filter((inc) => inc.status === APP_STATE.currentFilter);
    }

    if (APP_STATE.searchQuery) {
        const query = APP_STATE.searchQuery.toLowerCase();
        filtered = filtered.filter(
            (inc) =>
                inc.name.toLowerCase().includes(query) ||
                inc.reporter.toLowerCase().includes(query) ||
                inc.location.toLowerCase().includes(query)
        );
    }

    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return filtered;
}

function renderIncidents() {
    const filtered = getFilteredIncidents();
    if (filtered.length === 0) {
        const emptyMessage = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
                    <div style="font-size: 16px; font-weight: 500; margin-bottom: 8px;">No reports yet</div>
                    <div style="font-size: 13px; color: var(--muted);">When students submit reports, they will appear here</div>
                </td>
            </tr>
        `;
        if (DOM.tableBody) DOM.tableBody.innerHTML = emptyMessage;
        if (DOM.mobileCards) DOM.mobileCards.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; background: var(--surface); border-radius: 12px;">
                <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
                <div style="font-size: 16px; font-weight: 500;">No reports yet</div>
            </div>
        `;
    } else {
        renderTable(filtered);
        renderMobileCards(filtered);
    }
    updateStats();
}

function renderTable(incidents) {
    if (!DOM.tableBody) return;
    DOM.tableBody.innerHTML = incidents
        .map((incident) => createTableRow(incident))
        .join('');
}

function renderMobileCards(incidents) {
    if (!DOM.mobileCards) return;
    DOM.mobileCards.innerHTML = incidents
        .map((incident) => createMobileCard(incident))
        .join('');
}

function createTableRow(incident) {
    const categoryInfo = INCIDENT_CATEGORIES[incident.category] || INCIDENT_CATEGORIES.maintenance;
    const priorityInfo = PRIORITY_LEVELS[incident.priority] || PRIORITY_LEVELS.medium;
    const statusInfo = STATUS_OPTIONS[incident.status] || STATUS_OPTIONS.pending;

    return `
        <tr data-incident-id="${incident.id}">
            <td>
                <div class="inc-cell">
                    <div class="inc-icon-sm" style="background-color: ${categoryInfo.color}20; color: ${categoryInfo.color};" aria-hidden="true">
                        ${getCategoryIcon(incident.category)}
                    </div>
                    <div>
                        <div class="inc-name">${escapeHtml(incident.name)}</div>
                        <div class="inc-loc">${escapeHtml(incident.location)}</div>
                    </div>
                </div>
            </td>
            <td><span class="badge" style="background-color: ${categoryInfo.color}20; color: ${categoryInfo.color};">${categoryInfo.label}</span></td>
            <td><span class="badge" style="background-color: ${priorityInfo.color}20; color: ${priorityInfo.color};">${priorityInfo.label}</span></td>
            <td><span class="badge" style="background-color: ${statusInfo.color}20; color: ${statusInfo.color};">${statusInfo.icon} ${statusInfo.label}</span></td>
            <td><span class="reporter-name">${escapeHtml(incident.reporter)}</span></td>
            <td>
                <div class="action-btns">
                    <button class="action-btn" onclick="openModal(${incident.id})" aria-label="Edit incident" title="View Details">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                    <button class="action-btn del" onclick="deleteIncident(${incident.id})" aria-label="Delete incident" title="Delete">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function createMobileCard(incident) {
    const categoryInfo = INCIDENT_CATEGORIES[incident.category] || INCIDENT_CATEGORIES.maintenance;
    const priorityInfo = PRIORITY_LEVELS[incident.priority] || PRIORITY_LEVELS.medium;
    const statusInfo = STATUS_OPTIONS[incident.status] || STATUS_OPTIONS.pending;
    const timeAgo = getTimeAgo(new Date(incident.timestamp));

    return `
        <article class="m-card" data-incident-id="${incident.id}">
            <div class="m-card-top">
                <div class="inc-icon-sm" style="background-color: ${categoryInfo.color}20; color: ${categoryInfo.color};" aria-hidden="true">
                    ${getCategoryIcon(incident.category)}
                </div>
                <div>
                    <div class="inc-name">${escapeHtml(incident.name)}</div>
                    <div class="inc-loc">${escapeHtml(incident.location)}</div>
                </div>
            </div>
            <div class="m-card-body">
                <div>
                    <div class="m-field-label">Category</div>
                    <span class="badge" style="background-color: ${categoryInfo.color}20; color: ${categoryInfo.color};">${categoryInfo.label}</span>
                </div>
                <div>
                    <div class="m-field-label">Priority</div>
                    <span class="badge" style="background-color: ${priorityInfo.color}20; color: ${priorityInfo.color};">${priorityInfo.label}</span>
                </div>
                <div>
                    <div class="m-field-label">Status</div>
                    <span class="badge" style="background-color: ${statusInfo.color}20; color: ${statusInfo.color};">${statusInfo.icon} ${statusInfo.label}</span>
                </div>
                <div>
                    <div class="m-field-label">Reporter</div>
                    <div class="reporter-mobile">${escapeHtml(incident.reporter)}</div>
                </div>
            </div>
            <div class="m-card-footer">
                <div class="m-timestamp">${timeAgo}</div>
                <div class="action-btns">
                    <button class="action-btn" onclick="openModal(${incident.id})" aria-label="View Details" title="View Details">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                    <button class="action-btn del" onclick="deleteIncident(${incident.id})" aria-label="Delete incident" title="Delete">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        </article>
    `;
}

function handleDeleteIncident(id) {
    const incident = APP_STATE.incidents.find((inc) => inc.id === id);
    if (!incident) return;
    if (confirm(`Are you sure you want to delete "${incident.name}"?`)) {
        APP_STATE.incidents = APP_STATE.incidents.filter((inc) => inc.id !== id);
        saveIncidents();
        renderIncidents();
        showNotification(`✓ Incident deleted: ${incident.name}`, 'success');
    }
}

// Make functions global
window.deleteIncident = handleDeleteIncident;

function updateStats() {
    const incidents = APP_STATE.incidents;
    const statElements = document.querySelectorAll('.kpi-val');

    if (statElements.length >= 4) {
        statElements[0].textContent = incidents.length;
        statElements[1].textContent = '24h';
        statElements[2].textContent = '4'; 
        statElements[3].textContent = '92%';
    }

    updateCategoryStats();
}

function updateCategoryStats() {
    const categories = {
        security: 0,
        maintenance: 0,
        janitorial: 0,
        facilities: 0,
    };

    APP_STATE.incidents.forEach((inc) => {
        if (categories.hasOwnProperty(inc.category)) {
            categories[inc.category]++;
        }
    });

    const catCards = document.querySelectorAll('.cat-card');
    const catOrder = ['security', 'maintenance', 'janitorial', 'facilities'];
    catCards.forEach((card, i) => {
        const catKey = catOrder[i];
        const label = card.querySelector('.cat-num');
        if (label) label.textContent = categories[catKey];
    });
}

function getCategoryIcon(category) {
    const icons = {
        security: '⚠️',
        maintenance: '🔧',
        janitorial: '🧹',
        facilities: '🏢',
    };
    return icons[category] || '📋';
}

function getTimeAgo(date) {
    const seconds = Math.floor((Date.now() - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 16px;
        border-radius: 6px;
        background-color: ${type === 'success' ? '#10B981' : type === 'error' ? '#DC2626' : '#3B82F6'};
        color: white;
        font-size: 14px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        showNotification('✓ Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = '/LANDING PAGE/land.html';
        }, 1000);
    }
}

// Add CSS animations
if (!document.querySelector('style[data-app-animations]')) {
    const style = document.createElement('style');
    style.setAttribute('data-app-animations', 'true');
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

// Initialize the app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
