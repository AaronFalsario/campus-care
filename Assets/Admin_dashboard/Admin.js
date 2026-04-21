
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
    acilities: { label: 'Facilities', color: '#D97706', abbr: 'FAC' },
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

const SAMPLE_INCIDENTS = [
{
    id: 1,
    name: 'Sharp knife',
    location: 'Room 504, 5th floor',
    category: 'security',
    priority: 'high',
    status: 'pending',
    reporter: 'Lebron K. James',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
},
{
    id: 2,
    name: 'Dirty Toilet',
    location: '5th floor, near room 517',
    category: 'janitorial',
    priority: 'medium',
    status: 'resolved',
    reporter: 'Michael Jordan',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
},
{
    id: 3,
    name: 'Broken sparking wire',
    location: 'Room 504, 5th floor',
    category: 'maintenance',
    priority: 'high',
    status: 'in-progress',
    reporter: 'Gerald Anderson',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
},
];

function initializeApp() {
    loadIncidents();
    setupEventListeners();
    renderIncidents();
    updateStats();
}

function loadIncidents() {
    const stored = localStorage.getItem('incidents');
    APP_STATE.incidents = stored ? JSON.parse(stored) : SAMPLE_INCIDENTS;
}

function saveIncidents() {
    localStorage.setItem('incidents', JSON.stringify(APP_STATE.incidents));
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

function navigateTo(page) {
    APP_STATE.currentPage = page;
    console.log(`Navigated to: ${page}`);
    closeDrawer();
    showNotification(`Navigated to ${page}`);
}

function setupEventListeners() {
    // Drawer Controls
    DOM.hamburger.addEventListener('click', openDrawer);
    DOM.drawerClose.addEventListener('click', closeDrawer);
    DOM.overlay.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDrawer();
    });

    // Admin Pill - Opens drawer on desktop only
    if (DOM.adminPill) {
        DOM.adminPill.addEventListener('click', () => {
            if (window.innerWidth > 640) { 
                openDrawer();
            }
        });
    }


DOM.drawerItems.forEach((item) => {
    item.addEventListener('click', function() {
    DOM.drawerItems.forEach((i) => i.classList.remove('active'));
    this.classList.add('active');
    const page = this.getAttribute('data-page');
    navigateTo(page);
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
        if (incidentId) handleEditIncident(incidentId);
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

    filtered.sort((a, b) => b.timestamp - a.timestamp);
    return filtered;
}

function renderIncidents() {
    const filtered = getFilteredIncidents();
    renderTable(filtered);
    renderMobileCards(filtered);
    updateStats();
}

function renderTable(incidents) {
DOM.tableBody.innerHTML = incidents
    .map((incident) => createTableRow(incident))
    .join('');
}

function renderMobileCards(incidents) {
DOM.mobileCards.innerHTML = incidents
    .map((incident) => createMobileCard(incident))
    .join('');
}

function createTableRow(incident) {
    const categoryInfo = INCIDENT_CATEGORIES[incident.category];
    const priorityInfo = PRIORITY_LEVELS[incident.priority];
    const statusInfo = STATUS_OPTIONS[incident.status];

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
        <td td><span class="badge" style="background-color: ${categoryInfo.color}20; color: ${categoryInfo.color};">${categoryInfo.label}</span></td>
        <td><span class="badge" style="background-color: ${priorityInfo.color}20; color: ${priorityInfo.color};">${priorityInfo.label}</span></td>
        <td><span class="badge" style="background-color: ${statusInfo.color}20; color: ${statusInfo.color};">${statusInfo.icon} ${statusInfo.label}</span></td>
        <td><span class="reporter-name">${escapeHtml(incident.reporter)}</span></td>
        <td>
        <div class="action-btns">
            <button class="action-btn" aria-label="Edit incident" title="Edit">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            </button>
            <button class="action-btn del" aria-label="Delete incident" title="Delete">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
const categoryInfo = INCIDENT_CATEGORIES[incident.category];
const priorityInfo = PRIORITY_LEVELS[incident.priority];
const statusInfo = STATUS_OPTIONS[incident.status];
const timeAgo = getTimeAgo(incident.timestamp);

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
            <button class="action-btn" aria-label="Edit incident" title="Edit">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            </button>
            <button class="action-btn del" aria-label="Delete incident" title="Delete">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
            </button>
        </div>
    </div>
    </article>
`;
}

function handleEditIncident(id) {
const incident = APP_STATE.incidents.find((inc) => inc.id === id);
if (!incident) return;

const newStatus = prompt(
    `Edit Status for "${incident.name}"\n\nCurrent: ${incident.status}\nOptions: pending, in-progress, resolved`,
    incident.status
);

if (newStatus && Object.keys(STATUS_OPTIONS).includes(newStatus)) {
    incident.status = newStatus;
    saveIncidents();
    renderIncidents();
    showNotification(`✓ Incident updated: ${incident.name}`, 'success');
}
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

function updateStats() {
const incidents = APP_STATE.incidents;
const statElements = document.querySelectorAll('.kpi-val');

if (statElements.length >= 4) {
    statElements[0].textContent = incidents.length;
    const avgTime = Math.floor(Math.random() * (96 - 48 + 1) + 48);
    statElements[1].textContent = `${avgTime}h`;
    statElements[2].textContent = '4';
    const rating = (Math.random() * (98 - 85) + 85).toFixed(0);
    statElements[3].textContent = `${rating}%`;
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
    background-color: ${
    type === 'success' ? '#10B981' : type === 'error' ? '#DC2626' : '#3B82F6'
    };
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
    console.log('User logged out');
}

}

if (!document.querySelector('style[data-app-animations]')) {
    const style = document.createElement('style');
    style.setAttribute('data-app-animations', 'true');
    style.textContent = `
    @keyframes slideIn {
        from {
        transform: translateX(400px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
    }
    @keyframes slideOut {
        from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(400px);
        opacity: 0;
    }
}
`;
document.head.appendChild(style);
}


if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', initializeApp);
} else {
initializeApp();
}