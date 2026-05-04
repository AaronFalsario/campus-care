// Global variables
let allIncidents = [];
let filteredIncidents = [];
let currentFilter = 'all';
let currentPage = 1;
let rowsPerPage = 10;
let searchTerm = '';
let trendChart, categoryChart, priorityChart, statusChart;

// Load incidents from localStorage
function loadIncidents() {
    const stored = localStorage.getItem('campus_care_reports');
    if (stored && stored !== '[]') {
        allIncidents = JSON.parse(stored);
    } else {
        allIncidents = [];
    }
    applyFilters();
    updateStats();
    updateCharts();
    renderTable();
}

function applyFilters() {
    let filtered = [...allIncidents];
    
    if (currentFilter !== 'all') {
        filtered = filtered.filter(inc => inc.status === currentFilter);
    }
    
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(inc => 
            (inc.title || inc.name || '').toLowerCase().includes(term) ||
            (inc.reporter || '').toLowerCase().includes(term) ||
            (inc.studentId || inc.student_id || '').toString().includes(term)
        );
    }
    
    filteredIncidents = filtered;
    currentPage = 1;
}

function updateStats() {
    const total = allIncidents.length;
    const pending = allIncidents.filter(i => i.status === 'pending').length;
    const inProgress = allIncidents.filter(i => i.status === 'in-progress').length;
    const resolved = allIncidents.filter(i => i.status === 'resolved').length;
    
    document.getElementById('totalIncidents').textContent = total;
    document.getElementById('pendingIncidents').textContent = pending;
    document.getElementById('inProgressIncidents').textContent = inProgress;
    document.getElementById('resolvedIncidents').textContent = resolved;
}

function updateCharts() {
    const categories = { security: 0, maintenance: 0, janitorial: 0, facilities: 0 };
    const priorities = { high: 0, medium: 0, low: 0 };
    const statuses = { pending: 0, 'in-progress': 0, resolved: 0 };
    
    allIncidents.forEach(inc => {
        const cat = inc.category || 'maintenance';
        if (categories[cat] !== undefined) categories[cat]++;
        
        const pri = inc.priority || 'medium';
        if (priorities[pri] !== undefined) priorities[pri]++;
        
        const stat = inc.status || 'pending';
        if (statuses[stat] !== undefined) statuses[stat]++;
    });
    
    const months = [];
    const trendData = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
        const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = month.toLocaleString('default', { month: 'short' });
        months.push(monthName);
        const count = allIncidents.filter(inc => {
            const incDate = new Date(inc.timestamp);
            return incDate.getMonth() === month.getMonth() && incDate.getFullYear() === month.getFullYear();
        }).length;
        trendData.push(count);
    }
    
    // Get current dark mode state for chart colors
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#F1F5F9' : '#161513';
    const mutedColor = isDark ? '#94A3B8' : '#7A776F';
    const gridColor = isDark ? '#334155' : '#E4E1DB';
    
    // Destroy existing charts
    if (trendChart) trendChart.destroy();
    if (categoryChart) categoryChart.destroy();
    if (priorityChart) priorityChart.destroy();
    if (statusChart) statusChart.destroy();
    
    // Trend Chart
    const ctxTrend = document.getElementById('trendChart').getContext('2d');
    trendChart = new Chart(ctxTrend, {
        type: 'line',
        data: { 
            labels: months, 
            datasets: [{ 
                label: 'Incidents', 
                data: trendData, 
                borderColor: '#1D9E75', 
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(29,158,117,0.1)', 
                tension: 0.3, 
                fill: true,
                pointBackgroundColor: '#1D9E75',
                pointBorderColor: isDark ? '#1E293B' : '#FFFFFF',
                pointBorderWidth: 2,
                pointRadius: 4
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { 
                legend: { 
                    position: 'top',
                    labels: { color: textColor }
                } 
            },
            scales: {
                y: {
                    ticks: { color: mutedColor },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: mutedColor },
                    grid: { color: gridColor }
                }
            }
        }
    });
    
    // Category Chart
    const ctxCategory = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(ctxCategory, {
        type: 'doughnut',
        data: { 
            labels: ['Security', 'Maintenance', 'Janitorial', 'Facilities'], 
            datasets: [{ 
                data: [categories.security, categories.maintenance, categories.janitorial, categories.facilities], 
                backgroundColor: ['#DC2626', '#2563EB', '#1D9E75', '#D97706'],
                borderColor: isDark ? '#1E293B' : '#FFFFFF',
                borderWidth: 2
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { 
                legend: { 
                    position: 'bottom',
                    labels: { color: textColor }
                } 
            }
        }
    });
    
    // Priority Chart
    const ctxPriority = document.getElementById('priorityChart').getContext('2d');
    priorityChart = new Chart(ctxPriority, {
        type: 'bar',
        data: { 
            labels: ['High', 'Medium', 'Low'], 
            datasets: [{ 
                label: 'Count', 
                data: [priorities.high, priorities.medium, priorities.low], 
                backgroundColor: ['#DC2626', '#D97706', '#1D9E75'], 
                borderRadius: 8,
                borderColor: isDark ? '#1E293B' : '#FFFFFF',
                borderWidth: 1
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { 
                legend: { display: false } 
            },
            scales: {
                y: {
                    ticks: { color: mutedColor, stepSize: 1 },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor },
                    grid: { display: false }
                }
            }
        }
    });
    
    // Status Chart
    const ctxStatus = document.getElementById('statusChart').getContext('2d');
    statusChart = new Chart(ctxStatus, {
        type: 'pie',
        data: { 
            labels: ['Pending', 'In Progress', 'Resolved'], 
            datasets: [{ 
                data: [statuses.pending, statuses['in-progress'], statuses.resolved], 
                backgroundColor: ['#F59E0B', '#2563EB', '#1D9E75'],
                borderColor: isDark ? '#1E293B' : '#FFFFFF',
                borderWidth: 2
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { 
                legend: { 
                    position: 'bottom',
                    labels: { color: textColor }
                } 
            }
        }
    });
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = filteredIncidents.slice(start, end);
    
    if (pageData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No incidents found</td></tr>';
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    tbody.innerHTML = pageData.map(inc => `
        <tr>
            <td><strong>${escapeHtml(inc.title || inc.name)}</strong><br><span style="font-size: 11px; color: var(--muted);">${escapeHtml(inc.location || 'No location')}</span></td>
            <td><span class="badge b-${inc.category || 'maintenance'}">${inc.category || 'maintenance'}</span></td>
            <td><span class="badge b-${inc.priority || 'medium'}">${inc.priority || 'medium'}</span></td>
            <td><span class="badge b-${inc.status === 'in-progress' ? 'progress' : inc.status}">${inc.status || 'pending'}</span></td>
            <td>${escapeHtml(inc.reporter || 'Anonymous')}</td>
            <td>${inc.studentId || inc.student_id || 'N/A'}</td>
            <td>${getTimeAgo(inc.timestamp)}</td>
            <td><button class="view-btn" onclick="viewIncident(${inc.id})"><i class="fas fa-eye"></i> View</button></td>
        </tr>
    `).join('');
    
    renderPagination();
}

function renderPagination() {
    const totalPages = Math.ceil(filteredIncidents.length / rowsPerPage);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    pagination.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    renderTable();
}

function handleSearch() {
    searchTerm = document.getElementById('searchInput').value;
    applyFilters();
    renderTable();
}

function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-chip').forEach(btn => {
        if (btn.dataset.filter === filter) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    applyFilters();
    renderTable();
}

function viewIncident(id) {
    const inc = allIncidents.find(i => i.id === id);
    if (!inc) return;
    
    document.getElementById('modalTitle').innerText = inc.title || inc.name;
    document.getElementById('modalLocation').innerText = inc.location || 'Not specified';
    document.getElementById('modalCategory').innerHTML = `<span class="badge b-${inc.category}">${inc.category}</span>`;
    document.getElementById('modalPriority').innerHTML = `<span class="badge b-${inc.priority}">${inc.priority}</span>`;
    document.getElementById('modalStatus').innerHTML = `<span class="badge b-${inc.status === 'in-progress' ? 'progress' : inc.status}">${inc.status}</span>`;
    document.getElementById('modalReporter').innerText = inc.reporter || 'Anonymous';
    document.getElementById('modalStudentId').innerText = inc.studentId || inc.student_id || 'N/A';
    document.getElementById('modalDate').innerText = new Date(inc.timestamp).toLocaleString();
    document.getElementById('modalDescription').innerText = inc.description || 'No description provided';
    
    document.getElementById('incidentModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('incidentModal').classList.remove('active');
    document.body.style.overflow = '';
}

function exportToCSV() {
    const headers = ['Title', 'Location', 'Category', 'Priority', 'Status', 'Reporter', 'Student ID', 'Date'];
    const rows = filteredIncidents.map(inc => [
        inc.title || inc.name,
        inc.location || '',
        inc.category || '',
        inc.priority || '',
        inc.status || '',
        inc.reporter || '',
        inc.studentId || inc.student_id || '',
        new Date(inc.timestamp).toLocaleDateString()
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campuscare_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported successfully!');
}

function getTimeAgo(date) {
    if (!date) return 'Unknown';
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return 'Just now';
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ========== DARK MODE - SYNCED ACROSS ALL PAGES ==========
function initDarkMode() {
    // Use a consistent key for dark mode across all pages
    const saved = localStorage.getItem('darkMode');
    
    if (saved === 'enabled') {
        document.body.classList.add('dark-mode');
        updateDarkModeIcons(true);
    } else if (saved === 'disabled') {
        document.body.classList.remove('dark-mode');
        updateDarkModeIcons(false);
    } else {
        // Check system preference if no saved preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            document.body.classList.add('dark-mode');
            updateDarkModeIcons(true);
            localStorage.setItem('darkMode', 'enabled');
        }
    }
    
    const toggle = document.getElementById('darkModeToggle');
    if (toggle) {
        const newToggle = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(newToggle, toggle);
        
        newToggle.addEventListener('click', () => {
            if (document.body.classList.contains('dark-mode')) {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'disabled');
                updateDarkModeIcons(false);
            } else {
                document.body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'enabled');
                updateDarkModeIcons(true);
            }
            // Refresh charts when dark mode toggles
            updateCharts();
        });
    }
    
    // Listen for storage events from other tabs/pages
    window.addEventListener('storage', (e) => {
        if (e.key === 'darkMode') {
            const isDark = e.newValue === 'enabled';
            if (isDark) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
            updateDarkModeIcons(isDark);
            // Refresh charts when dark mode changes from another tab
            updateCharts();
        }
    });
}

function updateDarkModeIcons(isDark) {
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    if (sunIcon && moonIcon) {
        sunIcon.style.display = isDark ? 'none' : 'block';
        moonIcon.style.display = isDark ? 'block' : 'none';
    }
}

// ========== DRAWER AVATAR WITH INITIALS ==========
function loadAdminProfile() {
    const stored = localStorage.getItem('currentAdmin');
    if (stored) {
        try {
            const admin = JSON.parse(stored);
            const adminName = admin.name || 'Administrator';
            
            // Get initials (e.g., "John Doe" -> "JD")
            const initials = adminName
                .split(' ')
                .map(word => word.charAt(0).toUpperCase())
                .join('')
                .slice(0, 2);
            
            // Update drawer avatar with initials
            const drawerAvatar = document.querySelector('.drawer-avatar');
            if (drawerAvatar) {
                drawerAvatar.innerHTML = `<span style="font-size: 16px; font-weight: 600; color: white;">${initials}</span>`;
            }
            
            // Update drawer name
            const drawerName = document.getElementById('drawerAdminName');
            if (drawerName) drawerName.textContent = adminName;
            
            // Update admin pill in topbar
            const adminPill = document.getElementById('adminPill');
            if (adminPill) adminPill.textContent = adminName.split(' ')[0] || 'Admin';
            
            return admin;
        } catch(e) {
            console.error('Error loading admin:', e);
        }
    }
    
    // Default fallback
    const drawerAvatar = document.querySelector('.drawer-avatar');
    if (drawerAvatar) {
        drawerAvatar.innerHTML = `<span style="font-size: 16px; font-weight: 600; color: white;">AD</span>`;
    }
    return null;
}

// ========== UPDATE DRAWER ACTIVE STATE ==========
function updateDrawerActiveState() {
    // Get current page from URL
    const currentPath = window.location.pathname;
    const drawerItems = document.querySelectorAll('.drawer-item');
    
    drawerItems.forEach(item => {
        const page = item.getAttribute('data-page');
        item.classList.remove('active');
        
        if (page === 'dashboard' && currentPath.includes('Admin.html')) {
            item.classList.add('active');
        } else if (page === 'incidents' && currentPath.includes('incident')) {
            item.classList.add('active');
        } else if (page === 'analytics' && currentPath.includes('analytics')) {
            item.classList.add('active');
        } else if (page === 'users' && currentPath.includes('user_page')) {
            item.classList.add('active');
        } else if (page === 'settings' && currentPath.includes('setting')) {
            item.classList.add('active');
        }
    });
}

// ========== NAVIGATION - FULLY CONNECTED TO ALL PAGES ==========
function setupNavigation() {
    // Drawer navigation
    const dashboardBtn = document.querySelector('.drawer-item[data-page="dashboard"]');
    const incidentsBtn = document.querySelector('.drawer-item[data-page="incidents"]');
    const usersBtn = document.querySelector('.drawer-item[data-page="users"]');
    const analyticsBtn = document.querySelector('.drawer-item[data-page="analytics"]');
    const settingsBtn = document.querySelector('.drawer-item[data-page="settings"]');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (dashboardBtn) {
        const newBtn = dashboardBtn.cloneNode(true);
        dashboardBtn.parentNode.replaceChild(newBtn, dashboardBtn);
        newBtn.addEventListener('click', () => {
            window.location.href = '/Assets/Admin_dashboard/Admin.html';
        });
    }
    
    if (incidentsBtn) {
        const newBtn = incidentsBtn.cloneNode(true);
        incidentsBtn.parentNode.replaceChild(newBtn, incidentsBtn);
        newBtn.addEventListener('click', () => {
            window.location.href = '/Assets/Admin_dashboard/incident/incident.html';
        });
    }
    
    if (usersBtn) {
        const newBtn = usersBtn.cloneNode(true);
        usersBtn.parentNode.replaceChild(newBtn, usersBtn);
        newBtn.addEventListener('click', () => {
            window.location.href = '/Assets/Admin_dashboard/user_page/user.html';
        });
    }
    
    if (analyticsBtn) {
        const newBtn = analyticsBtn.cloneNode(true);
        analyticsBtn.parentNode.replaceChild(newBtn, analyticsBtn);
        newBtn.addEventListener('click', () => {
            location.reload();
        });
    }
    
    if (settingsBtn) {
        const newBtn = settingsBtn.cloneNode(true);
        settingsBtn.parentNode.replaceChild(newBtn, settingsBtn);
        newBtn.addEventListener('click', () => {
            window.location.href = '/Assets/Admin_dashboard/settings/setting.html';
        });
    }
    
    if (logoutBtn) {
        const newLogout = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogout, logoutBtn);
        newLogout.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('currentAdmin');
                localStorage.removeItem('isAdminLoggedIn');
                showToast('Logged out successfully');
                setTimeout(() => {
                    window.location.href = '/Assets/Landing_page/land.html';
                }, 500);
            }
        });
    }
    
    // Bottom navigation
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    bottomNavItems.forEach(item => {
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        newItem.addEventListener('click', () => {
            const page = newItem.getAttribute('data-page');
            if (page === 'dashboard') {
                window.location.href = '/Assets/Admin_dashboard/Admin.html';
            } else if (page === 'incidents') {
                window.location.href = '/Assets/Admin_dashboard/incident/incident.html';
            } else if (page === 'users') {
                window.location.href = '/Assets/Admin_dashboard/user_page/user.html';
            } else if (page === 'analytics') {
                location.reload();
            } else if (page === 'settings') {
                window.location.href = '/Assets/Admin_dashboard/settings/setting.html';
            }
        });
    });
}

// ========== CHECK AUTHENTICATION ==========
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    const currentAdmin = localStorage.getItem('currentAdmin');
    
    if (!isLoggedIn || isLoggedIn !== 'true' || !currentAdmin) {
        window.location.href = '/Assets/login/admin/admin.html';
        return false;
    }
    return true;
}

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    
    loadIncidents();
    setupNavigation();
    initDarkMode();
    loadAdminProfile();
    updateDrawerActiveState();
    
    document.getElementById('searchInput')?.addEventListener('input', handleSearch);
    document.getElementById('exportTableBtn')?.addEventListener('click', exportToCSV);
    document.getElementById('exportCSVBtn')?.addEventListener('click', exportToCSV);
    
    document.querySelectorAll('.filter-chip').forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });
});

// Expose functions globally
window.goToPage = goToPage;
window.viewIncident = viewIncident;
window.closeModal = closeModal;