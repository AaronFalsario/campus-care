import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Global variables
let allIncidents = [];
let filteredIncidents = [];
let currentFilter = 'all';
let currentPage = 1;
let rowsPerPage = 10;
let searchTerm = '';
let trendChart, categoryChart, priorityChart, statusChart;
let realtimeSubscription = null;

// ========== LOAD INCIDENTS FROM SUPABASE (NOT LOCALSTORAGE) ==========
async function loadIncidents() {
    try {
        const { data, error } = await supabase
            .from('incident')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Convert Supabase data to match your existing format
        allIncidents = (data || []).map(inc => ({
            id: inc.id,
            title: inc.title,
            name: inc.title,
            location: inc.location,
            category: inc.category || 'maintenance',
            priority: inc.priority || 'medium',
            status: inc.status || 'pending',
            reporter: inc.student_name || 'Student',
            student_id: inc.student_id_number,
            studentId: inc.student_id_number,
            description: inc.description,
            timestamp: inc.created_at,
            image_url: inc.image_url,
            is_anonymous: inc.is_anonymous,
            resolved_at: inc.resolved_at,
            updated_at: inc.updated_at
        }));
        
        console.log(`Loaded ${allIncidents.length} incidents from Supabase`);
        
        applyFilters();
        updateStats();
        updateCharts();
        renderTable();
        
    } catch (error) {
        console.error('Error loading incidents from Supabase:', error);
        // Fallback to localStorage if Supabase fails
        loadFromLocalStorage();
    }
}

// Fallback function
function loadFromLocalStorage() {
    const stored = localStorage.getItem('campus_care_reports');
    if (stored && stored !== '[]') {
        allIncidents = JSON.parse(stored);
        console.log(`Loaded ${allIncidents.length} incidents from localStorage (fallback)`);
    } else {
        allIncidents = [];
    }
    applyFilters();
    updateStats();
    updateCharts();
    renderTable();
}

// ========== REAL-TIME SUBSCRIPTION ==========
function setupRealtimeSubscription() {
    if (realtimeSubscription) return;
    
    console.log('Setting up real-time subscription for analytics...');
    
    realtimeSubscription = supabase
        .channel('analytics-realtime-channel')
        .on('postgres_changes', 
            { 
                event: '*',  // Listen to INSERT, UPDATE, DELETE
                schema: 'public', 
                table: 'incident' 
            }, 
            async (payload) => {
                console.log('Analytics: Real-time change detected!', payload.eventType, payload.new?.id);
                
                // Reload all data from Supabase
                await loadIncidents();
                
                // Show notification
                if (payload.eventType === 'UPDATE') {
                    const oldStatus = payload.old?.status;
                    const newStatus = payload.new?.status;
                    if (oldStatus !== newStatus) {
                        showToast(`🔄 Status updated: ${oldStatus} → ${newStatus}`);
                    }
                } else if (payload.eventType === 'INSERT') {
                    showToast(`📝 New incident reported: ${payload.new?.title}`);
                } else if (payload.eventType === 'DELETE') {
                    showToast(`🗑️ Incident deleted`);
                }
            }
        )
        .subscribe((status) => {
            console.log('Analytics realtime subscription status:', status);
        });
    
    // Also listen for localStorage changes as backup (for cross-tab)
    window.addEventListener('storage', (event) => {
        if (event.key === 'campus_care_reports') {
            console.log('localStorage change detected, reloading...');
            loadIncidents();
        }
    });
}

// ========== DARK MODE ==========
function initDarkMode() {
    const saved = localStorage.getItem('admin_dark_mode');
    const toggle = document.getElementById('darkModeToggle');
    
    if (saved === 'enabled') {
        document.body.classList.add('dark-mode');
        if (toggle) {
            const sunIcon = toggle.querySelector('.sun-icon');
            const moonIcon = toggle.querySelector('.moon-icon');
            if (sunIcon) sunIcon.style.display = 'none';
            if (moonIcon) moonIcon.style.display = 'block';
        }
        setTimeout(() => updateChartColorsForDarkMode(true), 100);
    } else if (saved === 'disabled') {
        document.body.classList.remove('dark-mode');
        if (toggle) {
            const sunIcon = toggle.querySelector('.sun-icon');
            const moonIcon = toggle.querySelector('.moon-icon');
            if (sunIcon) sunIcon.style.display = 'block';
            if (moonIcon) moonIcon.style.display = 'none';
        }
        setTimeout(() => updateChartColorsForDarkMode(false), 100);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            document.body.classList.add('dark-mode');
            if (toggle) {
                const sunIcon = toggle.querySelector('.sun-icon');
                const moonIcon = toggle.querySelector('.moon-icon');
                if (sunIcon) sunIcon.style.display = 'none';
                if (moonIcon) moonIcon.style.display = 'block';
            }
            localStorage.setItem('admin_dark_mode', 'enabled');
            setTimeout(() => updateChartColorsForDarkMode(true), 100);
        }
    }
    
    if (toggle) {
        const newToggle = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(newToggle, toggle);
        
        newToggle.addEventListener('click', () => {
            if (document.body.classList.contains('dark-mode')) {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('admin_dark_mode', 'disabled');
                const sunIcon = newToggle.querySelector('.sun-icon');
                const moonIcon = newToggle.querySelector('.moon-icon');
                if (sunIcon) sunIcon.style.display = 'block';
                if (moonIcon) moonIcon.style.display = 'none';
                updateChartColorsForDarkMode(false);
                setTimeout(() => updateCharts(), 100);
            } else {
                document.body.classList.add('dark-mode');
                localStorage.setItem('admin_dark_mode', 'enabled');
                const sunIcon = newToggle.querySelector('.sun-icon');
                const moonIcon = newToggle.querySelector('.moon-icon');
                if (sunIcon) sunIcon.style.display = 'none';
                if (moonIcon) moonIcon.style.display = 'block';
                updateChartColorsForDarkMode(true);
                setTimeout(() => updateCharts(), 100);
            }
        });
    }
    
    window.addEventListener('storage', (e) => {
        if (e.key === 'admin_dark_mode') {
            const isDark = e.newValue === 'enabled';
            if (isDark) {
                document.body.classList.add('dark-mode');
                updateChartColorsForDarkMode(true);
            } else {
                document.body.classList.remove('dark-mode');
                updateChartColorsForDarkMode(false);
            }
            setTimeout(() => updateCharts(), 100);
        }
    });
}

function updateChartColorsForDarkMode(isDark) {
    const textColor = isDark ? '#F1F5F9' : '#161513';
    const mutedColor = isDark ? '#94A3B8' : '#7A776F';
    const gridColor = isDark ? '#334155' : '#E4E1DB';
    
    if (trendChart) {
        if (trendChart.options.plugins?.legend?.labels) {
            trendChart.options.plugins.legend.labels.color = textColor;
        }
        if (trendChart.options.scales?.y?.ticks) {
            trendChart.options.scales.y.ticks.color = mutedColor;
        }
        if (trendChart.options.scales?.x?.ticks) {
            trendChart.options.scales.x.ticks.color = mutedColor;
        }
        if (trendChart.options.scales?.y?.grid) {
            trendChart.options.scales.y.grid.color = gridColor;
        }
        if (trendChart.options.scales?.x?.grid) {
            trendChart.options.scales.x.grid.color = gridColor;
        }
        trendChart.update();
    }
    
    if (categoryChart && categoryChart.options.plugins?.legend?.labels) {
        categoryChart.options.plugins.legend.labels.color = textColor;
        categoryChart.update();
    }
    
    if (priorityChart) {
        if (priorityChart.options.scales?.y?.ticks) {
            priorityChart.options.scales.y.ticks.color = mutedColor;
        }
        if (priorityChart.options.scales?.x?.ticks) {
            priorityChart.options.scales.x.ticks.color = textColor;
        }
        if (priorityChart.options.scales?.y?.grid) {
            priorityChart.options.scales.y.grid.color = gridColor;
        }
        priorityChart.update();
    }
    
    if (statusChart && statusChart.options.plugins?.legend?.labels) {
        statusChart.options.plugins.legend.labels.color = textColor;
        statusChart.update();
    }
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
    
    const totalEl = document.getElementById('totalIncidents');
    const pendingEl = document.getElementById('pendingIncidents');
    const inProgressEl = document.getElementById('inProgressIncidents');
    const resolvedEl = document.getElementById('resolvedIncidents');
    
    if (totalEl) totalEl.textContent = total;
    if (pendingEl) pendingEl.textContent = pending;
    if (inProgressEl) inProgressEl.textContent = inProgress;
    if (resolvedEl) resolvedEl.textContent = resolved;
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
    
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#F1F5F9' : '#161513';
    const mutedColor = isDark ? '#94A3B8' : '#7A776F';
    const gridColor = isDark ? '#334155' : '#E4E1DB';
    
    if (trendChart) trendChart.destroy();
    if (categoryChart) categoryChart.destroy();
    if (priorityChart) priorityChart.destroy();
    if (statusChart) statusChart.destroy();
    
    const ctxTrend = document.getElementById('trendChart');
    if (ctxTrend) {
        trendChart = new Chart(ctxTrend.getContext('2d'), {
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
                        labels: { color: textColor, font: { size: 11 } }
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        titleColor: textColor,
                        bodyColor: mutedColor,
                        borderColor: gridColor,
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        ticks: { color: mutedColor, stepSize: 1 },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: mutedColor },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    }
    
    const ctxCategory = document.getElementById('categoryChart');
    if (ctxCategory) {
        categoryChart = new Chart(ctxCategory.getContext('2d'), {
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
                        labels: { color: textColor, font: { size: 11 } }
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        titleColor: textColor,
                        bodyColor: mutedColor
                    }
                }
            }
        });
    }
    
    const ctxPriority = document.getElementById('priorityChart');
    if (ctxPriority) {
        priorityChart = new Chart(ctxPriority.getContext('2d'), {
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
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        titleColor: textColor,
                        bodyColor: mutedColor
                    }
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
    }
    
    const ctxStatus = document.getElementById('statusChart');
    if (ctxStatus) {
        statusChart = new Chart(ctxStatus.getContext('2d'), {
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
                        labels: { color: textColor, font: { size: 11 } }
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        titleColor: textColor,
                        bodyColor: mutedColor
                    }
                }
            }
        });
    }
}

function renderTable() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = filteredIncidents.slice(start, end);
    
    if (pageData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No incidents found</td></tr>';
        const pagination = document.getElementById('pagination');
        if (pagination) pagination.innerHTML = '';
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
    
    if (!pagination) return;
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    html += `<button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>← Prev</button>`;
    
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    
    html += `<button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next →</button>`;
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
    
    const modalTitle = document.getElementById('modalTitle');
    const modalLocation = document.getElementById('modalLocation');
    const modalCategory = document.getElementById('modalCategory');
    const modalPriority = document.getElementById('modalPriority');
    const modalStatus = document.getElementById('modalStatus');
    const modalReporter = document.getElementById('modalReporter');
    const modalStudentId = document.getElementById('modalStudentId');
    const modalDate = document.getElementById('modalDate');
    const modalDescription = document.getElementById('modalDescription');
    
    if (modalTitle) modalTitle.innerText = inc.title || inc.name;
    if (modalLocation) modalLocation.innerText = inc.location || 'Not specified';
    if (modalCategory) modalCategory.innerHTML = `<span class="badge b-${inc.category}">${inc.category}</span>`;
    if (modalPriority) modalPriority.innerHTML = `<span class="badge b-${inc.priority}">${inc.priority}</span>`;
    if (modalStatus) modalStatus.innerHTML = `<span class="badge b-${inc.status === 'in-progress' ? 'progress' : inc.status}">${inc.status}</span>`;
    if (modalReporter) modalReporter.innerText = inc.reporter || 'Anonymous';
    if (modalStudentId) modalStudentId.innerText = inc.studentId || inc.student_id || 'N/A';
    if (modalDate) modalDate.innerText = new Date(inc.timestamp).toLocaleString();
    if (modalDescription) modalDescription.innerText = inc.description || 'No description provided';
    
    const modal = document.getElementById('incidentModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('incidentModal');
    if (modal) modal.classList.remove('active');
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
    return text.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function loadAdminProfile() {
    const stored = localStorage.getItem('currentAdmin');
    if (stored) {
        try {
            const admin = JSON.parse(stored);
            const adminName = admin.name || 'Administrator';
            
            const initials = adminName
                .split(' ')
                .map(word => word.charAt(0).toUpperCase())
                .join('')
                .slice(0, 2);
            
            const drawerAvatar = document.querySelector('.drawer-avatar');
            if (drawerAvatar) {
                drawerAvatar.innerHTML = `<span style="font-size: 16px; font-weight: 600; color: white;">${initials}</span>`;
            }
            
            const drawerName = document.getElementById('drawerAdminName');
            if (drawerName) drawerName.textContent = adminName;
            
            const adminPill = document.getElementById('adminPill');
            if (adminPill) adminPill.textContent = adminName.split(' ')[0] || 'Admin';
            
            return admin;
        } catch(e) {
            console.error('Error loading admin:', e);
        }
    }
    
    const drawerAvatar = document.querySelector('.drawer-avatar');
    if (drawerAvatar) {
        drawerAvatar.innerHTML = `<span style="font-size: 16px; font-weight: 600; color: white;">AD</span>`;
    }
    return null;
}

function updateDrawerActiveState() {
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

function setupNavigation() {
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
            window.location.href = '/Assets/Admin_dashboard/analytics/analytics.html';
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
                    window.location.href = '/land.html';
                }, 500);
            }
        });
    }
    
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
                window.location.href = '/Assets/Admin_dashboard/analytics/analytics.html';
            } else if (page === 'settings') {
                window.location.href = '/Assets/Admin_dashboard/settings/setting.html';
            }
        });
    });
}

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
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;
    
    await loadIncidents();  // Load from Supabase
    setupRealtimeSubscription();  // Listen for real-time changes
    setupNavigation();
    initDarkMode();
    loadAdminProfile();
    updateDrawerActiveState();
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', handleSearch);
    
    const exportTableBtn = document.getElementById('exportTableBtn');
    if (exportTableBtn) exportTableBtn.addEventListener('click', exportToCSV);
    
    const exportCSVBtn = document.getElementById('exportCSVBtn');
    if (exportCSVBtn) exportCSVBtn.addEventListener('click', exportToCSV);
    
    document.querySelectorAll('.filter-chip').forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });
});

// Expose functions globally
window.goToPage = goToPage;
window.viewIncident = viewIncident;
window.closeModal = closeModal;