import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

let students = [];
let editingStudentId = null;
let currentAdmin = null;
let realtimeSubscription = null;

// ========== NOTIFICATION SYSTEM ==========
let notifications = [];
let notificationIdCounter = 0;
let isNotificationDropdownOpen = false;

// ========== LOAD ADMIN TO DRAWER ==========
function loadAdminToDrawer() {
    try {
        const storedAdmin = localStorage.getItem('currentAdmin');
        const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
        
        if (!storedAdmin || isLoggedIn !== 'true') {
            window.location.href = '/Assets/login/admin/admin.html';
            return false;
        }
        
        currentAdmin = JSON.parse(storedAdmin);
        const adminName = currentAdmin.name || currentAdmin.email;
        const adminInitials = adminName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        
        const drawerName = document.querySelector('.drawer-name');
        const drawerRole = document.querySelector('.drawer-role');
        const drawerAvatar = document.querySelector('.drawer-avatar');
        const adminPill = document.getElementById('adminPill');
        
        if (drawerName) drawerName.textContent = adminName;
        if (drawerRole) drawerRole.textContent = currentAdmin.role || 'Campus Care Admin';
        if (adminPill) adminPill.textContent = adminName.split(' ')[0] || 'Admin';
        if (drawerAvatar) {
            drawerAvatar.innerHTML = `<span style="font-size: 16px; font-weight: 600; color: white;">${adminInitials}</span>`;
        }
        
        return true;
    } catch (error) {
        console.error('Error loading admin:', error);
        return false;
    }
}

// ========== DARK MODE ==========
function initDarkMode() {
    const savedMode = localStorage.getItem('admin_dark_mode');
    const toggle = document.getElementById('darkModeToggle');
    
    if (savedMode === 'enabled') {
        document.body.classList.add('dark-mode');
        if (toggle) {
            const sunIcon = toggle.querySelector('.sun-icon');
            const moonIcon = toggle.querySelector('.moon-icon');
            if (sunIcon) sunIcon.style.display = 'none';
            if (moonIcon) moonIcon.style.display = 'block';
        }
    }
    
    if (toggle) {
        toggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('admin_dark_mode', isDark ? 'enabled' : 'disabled');
            const sunIcon = toggle.querySelector('.sun-icon');
            const moonIcon = toggle.querySelector('.moon-icon');
            if (sunIcon && moonIcon) {
                if (isDark) {
                    sunIcon.style.display = 'none';
                    moonIcon.style.display = 'block';
                } else {
                    sunIcon.style.display = 'block';
                    moonIcon.style.display = 'none';
                }
            }
        });
    }
}

// ========== NOTIFICATION FUNCTIONS ==========
function loadNotifications() {
    const stored = localStorage.getItem('admin_notifications');
    if (stored) {
        try {
            notifications = JSON.parse(stored);
            notificationIdCounter = notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 0;
        } catch (e) {
            notifications = [];
            notificationIdCounter = 0;
        }
    } else {
        notifications = [];
    }
    updateNotificationBadge();
    createNotificationDropdown();
    updateNotificationDropdown();
}

function saveNotifications() {
    localStorage.setItem('admin_notifications', JSON.stringify(notifications));
    updateNotificationBadge();
}

function addInternalNotification(title, message, isUrgent = false) {
    const notification = {
        id: notificationIdCounter++,
        title: title,
        message: message,
        timestamp: new Date().toISOString(),
        read: false,
        isUrgent: isUrgent
    };
    notifications.unshift(notification);
    saveNotifications();
    updateNotificationDropdown();
    if (notifications.length > 50) notifications = notifications.slice(0, 50);
}

function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const urgentCount = notifications.filter(n => !n.read && n.isUrgent).length;
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = urgentCount > 0 ? `🔥${unreadCount}` : (unreadCount > 9 ? '9+' : unreadCount);
            badge.style.display = 'flex';
            if (urgentCount > 0) {
                badge.style.background = '#DC2626';
                badge.style.animation = 'pulse 0.5s ease infinite';
            } else {
                badge.style.background = 'var(--red)';
                badge.style.animation = 'none';
            }
        } else {
            badge.style.display = 'none';
        }
    }
}

function createNotificationDropdown() {
    let dropdown = document.getElementById('notificationDropdown');
    if (dropdown) dropdown.remove();
    dropdown = document.createElement('div');
    dropdown.id = 'notificationDropdown';
    dropdown.className = 'notification-dropdown';
    document.body.appendChild(dropdown);
    return dropdown;
}

function updateNotificationDropdown() {
    let dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) dropdown = createNotificationDropdown();
    
    if (!notifications || notifications.length === 0) {
        dropdown.innerHTML = `
            <div class="notification-dropdown-header">
                <span>🔔 Notifications</span>
                <button class="clear-all-dropdown" onclick="clearAllNotifications()">Clear all</button>
            </div>
            <div class="notification-dropdown-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <p>No notifications yet</p>
                <p style="font-size: 11px; margin-top: 4px;">Student updates will appear here</p>
            </div>
        `;
        return;
    }
    
    const unreadCount = notifications.filter(n => !n.read).length;
    dropdown.innerHTML = `
        <div class="notification-dropdown-header">
            <span>🔔 Notifications ${unreadCount > 0 ? `(${unreadCount})` : ''}</span>
            <button class="clear-all-dropdown" onclick="clearAllNotifications()">Clear all</button>
        </div>
        <div class="notification-dropdown-list">
            ${notifications.slice(0, 15).map(notif => `
                <div class="notification-dropdown-item ${!notif.read ? 'unread' : ''} ${notif.isUrgent ? 'urgent' : ''}" onclick="markNotificationRead(${notif.id})">
                    <div class="notification-dropdown-title">${notif.isUrgent ? '🚨 ' : '📋 '}${escapeHtml(notif.title)}</div>
                    <div class="notification-dropdown-message">${escapeHtml(notif.message)}</div>
                    <div class="notification-dropdown-time">${getTimeAgo(notif.timestamp)}</div>
                </div>
            `).join('')}
        </div>
        ${notifications.length > 15 ? `<div class="notification-dropdown-footer">${notifications.length - 15} more notifications</div>` : ''}
    `;
}

function toggleNotificationDropdown() {
    let dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) {
        dropdown = createNotificationDropdown();
        updateNotificationDropdown();
    }
    
    if (isNotificationDropdownOpen) {
        dropdown.classList.remove('show');
        isNotificationDropdownOpen = false;
        document.removeEventListener('click', closeNotificationDropdownOutside);
    } else {
        dropdown.classList.add('show');
        isNotificationDropdownOpen = true;
        setTimeout(() => {
            document.addEventListener('click', closeNotificationDropdownOutside);
        }, 100);
    }
}

function closeNotificationDropdownOutside(e) {
    const dropdown = document.getElementById('notificationDropdown');
    const bell = document.getElementById('notificationBell');
    if (dropdown && bell && !dropdown.contains(e.target) && !bell.contains(e.target)) {
        dropdown.classList.remove('show');
        isNotificationDropdownOpen = false;
        document.removeEventListener('click', closeNotificationDropdownOutside);
    }
}

window.markNotificationRead = function(id) {
    const notif = notifications.find(n => n.id === id);
    if (notif) {
        notif.read = true;
        saveNotifications();
        updateNotificationDropdown();
    }
};

window.clearAllNotifications = function() {
    notifications = [];
    saveNotifications();
    updateNotificationDropdown();
    showToast('All notifications cleared', 'success');
};

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function getTimeAgo(dateString) {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const h = Math.floor((Date.now() - date) / 3600000);
    if (h < 1) return 'Just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

// ========== UPDATE STUDENT STATUS BASED ON LAST_LOGIN AND LAST_LOGOUT ==========
async function updateStudentStatusFromAuth() {
    try {
        console.log('Updating student statuses based on last_login and last_logout...');
        const now = new Date();
        let hasChanges = false;
        
        for (const student of students) {
            const lastLogin = student.last_login ? new Date(student.last_login) : null;
            const lastLogout = student.last_logout ? new Date(student.last_logout) : null;
            
            let isActive = false;
            
            if (!lastLogin) {
                isActive = false;
            } else if (lastLogout && lastLogout > lastLogin) {
                isActive = false;
            } else {
                const minutesSinceLastLogin = (now - lastLogin) / (1000 * 60);
                isActive = minutesSinceLastLogin < 30;
            }
            
            const newStatus = isActive ? 'active' : 'inactive';
            
            if (student.status !== newStatus) {
                const { error } = await supabase
                    .from('student')
                    .update({ status: newStatus })
                    .eq('id', student.id);
                
                if (!error) {
                    student.status = newStatus;
                    hasChanges = true;
                    console.log(`${student.name} → ${newStatus}`);
                }
            }
        }
        
        if (hasChanges) {
            renderStudents();
            updateStats();
            console.log('✅ Student statuses updated');
        }
        
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

// ========== GET STUDENT REPORT COUNT FROM INCIDENTS ==========
async function getStudentReportCount(studentIdNumber) {
    try {
        const { count, error } = await supabase
            .from('incident')
            .select('*', { count: 'exact', head: true })
            .eq('student_id_number', studentIdNumber);
        
        if (error) {
            console.error('Error counting incidents:', error);
            return 0;
        }
        
        return count || 0;
    } catch (error) {
        console.error('Error:', error);
        return 0;
    }
}

// ========== LOAD STUDENTS FROM SUPABASE ==========
async function loadStudents() {
    try {
        console.log('Loading students from Supabase student table...');
        
        const { data, error } = await supabase
            .from('student')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Supabase error:', error);
            showToast('Failed to load students', 'error');
            return;
        }
        
        if (data && data.length > 0) {
            const studentsWithReports = await Promise.all(data.map(async (s) => {
                const reportCount = await getStudentReportCount(s.student_id);
                return {
                    id: s.id,
                    name: s.full_name || 'Unknown',
                    idNumber: s.student_id || 'N/A',
                    email: s.email || 'N/A',
                    course: s.course || 'Not Set',
                    year: s.year_level || '1',
                    status: s.status || 'inactive',
                    reports: reportCount,
                    last_login: s.last_login || s.created_at || null,
                    last_logout: s.last_logout || null
                };
            }));
            
            students = studentsWithReports;
            console.log(`✅ Loaded ${students.length} students`);
        } else {
            students = [];
        }
        
        await updateStudentStatusFromAuth();
        renderStudents();
        updateStats();
    } catch (error) {
        console.error('Error loading students:', error);
        showToast('Error loading students', 'error');
    }
}

// ========== UPDATE REPORT COUNTS ==========
async function updateAllReportCounts() {
    console.log('Updating report counts...');
    let hasChanges = false;
    
    for (const student of students) {
        const newCount = await getStudentReportCount(student.idNumber);
        if (student.reports !== newCount) {
            student.reports = newCount;
            hasChanges = true;
        }
    }
    
    if (hasChanges) {
        renderStudents();
        updateStats();
    }
}

// ========== REAL-TIME SUBSCRIPTION ==========
function setupRealtimeSubscription() {
    if (realtimeSubscription) return;
    
    realtimeSubscription = supabase
        .channel('student-management-changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'student' },
            (payload) => {
                console.log('Real-time student update:', payload.eventType);
                loadStudents();
                if (payload.eventType === 'INSERT') {
                    addInternalNotification('New Student Registered', `${payload.new.full_name} has created an account`, false);
                    showToast(`📢 New student registered!`, 'info');
                }
            }
        )
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'incident' },
            () => updateAllReportCounts()
        )
        .subscribe();
}

// ========== RENDER STUDENTS TABLE ==========
function renderStudents() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;
    
    if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:60px;">👨‍🎓 No students found</td></tr>`;
        return;
    }
    
    tbody.innerHTML = students.map(student => `
        <tr data-id="${student.id}">
            <td>
                <div class="student-info">
                    <div class="student-avatar">${getInitials(student.name)}</div>
                    <div>
                        <div class="student-name">${escapeHtml(student.name)}</div>
                        <div class="student-detail">${escapeHtml(student.email)}</div>
                    </div>
                </div>
            </td>
            <td><strong>${escapeHtml(student.idNumber)}</strong></td>
            <td>${escapeHtml(student.course)} - ${student.year}${getYearSuffix(student.year)} Year</td>
            <td><span class="badge-active">${student.reports || 0} reports</span></td>
            <td>
                <span class="status-badge ${student.status === 'active' ? 'status-active' : 'status-inactive'}">
                    ${student.status === 'active' ? '🟢 Active' : '⚫ Inactive'}
                </span>
            </td>
            <td>${formatDate(student.last_login)}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit-student" data-id="${student.id}" title="Edit">✏️</button>
                    <button class="action-btn del delete-student" data-id="${student.id}" title="Delete">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    document.querySelectorAll('.edit-student').forEach(btn => {
        btn.onclick = () => editStudent(btn.dataset.id);
    });
    document.querySelectorAll('.delete-student').forEach(btn => {
        btn.onclick = () => deleteStudent(btn.dataset.id);
    });
}

// ========== DELETE STUDENT ==========
async function deleteStudent(id) {
    const student = students.find(s => s.id == id);
    if (!student) return;
    
    if (!confirm(`⚠️ WARNING: This will permanently delete "${student.name}"\n\nThis action CANNOT be undone!`)) return;
    
    showToast('Deleting student account...', 'info');
    
    try {
        const { error } = await supabase.from('student').delete().eq('id', id);
        
        if (error) {
            showToast('Failed to delete student', 'error');
            return;
        }
        
        showToast(`✓ ${student.name} has been deleted`, 'success');
        addInternalNotification('Student Deleted', `${student.name} has been removed`, false);
        
        students = students.filter(s => s.id != id);
        renderStudents();
        updateStats();
        
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete student', 'error');
    }
}

// ========== EDIT STUDENT - MAKE NAME, ID, EMAIL NON-EDITABLE ==========
function editStudent(id) {
    const student = students.find(s => s.id == id);
    if (!student) return;
    
    editingStudentId = id;
    
    // Set values
    document.getElementById('studentId').value = student.id;
    document.getElementById('studentFullName').value = student.name;
    document.getElementById('studentIdNumber').value = student.idNumber;
    document.getElementById('studentCourse').value = student.course;
    document.getElementById('studentYear').value = student.year;
    document.getElementById('studentEmail').value = student.email;
    
    // IMPORTANT: Disable the fields that should NOT be editable (Name, ID Number, Email)
    const nameInput = document.getElementById('studentFullName');
    const idNumberInput = document.getElementById('studentIdNumber');
    const emailInput = document.getElementById('studentEmail');
    
    if (nameInput) nameInput.disabled = true;
    if (idNumberInput) idNumberInput.disabled = true;
    if (emailInput) emailInput.disabled = true;
    
    // Add visual hint for disabled fields (optional but nice)
    if (nameInput) nameInput.style.opacity = '0.7';
    if (idNumberInput) idNumberInput.style.opacity = '0.7';
    if (emailInput) emailInput.style.opacity = '0.7';
    
    document.getElementById('modalTitle').textContent = 'Edit Student';
    openModal();
}

// ========== RESET FORM FIELDS WHEN ADDING NEW STUDENT ==========
function resetFormForAdd() {
    const nameInput = document.getElementById('studentFullName');
    const idNumberInput = document.getElementById('studentIdNumber');
    const emailInput = document.getElementById('studentEmail');
    
    if (nameInput) {
        nameInput.disabled = false;
        nameInput.style.opacity = '1';
    }
    if (idNumberInput) {
        idNumberInput.disabled = false;
        idNumberInput.style.opacity = '1';
    }
    if (emailInput) {
        emailInput.disabled = false;
        emailInput.style.opacity = '1';
    }
    
    document.getElementById('studentForm').reset();
    document.getElementById('studentId').value = '';
    editingStudentId = null;
}

// ========== FORM SUBMIT ==========
const studentForm = document.getElementById('studentForm');
if (studentForm) {
    studentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const isEditing = editingStudentId !== null;
        
        const studentData = {
            full_name: document.getElementById('studentFullName')?.value.trim() || '',
            student_id: document.getElementById('studentIdNumber')?.value.trim() || '',
            course: document.getElementById('studentCourse')?.value || 'N/A',
            year_level: document.getElementById('studentYear')?.value || '1',
            email: document.getElementById('studentEmail')?.value.trim() || '',
            status: document.getElementById('studentStatus')?.value || 'inactive',
            updated_at: new Date().toISOString()
        };
        
        if (!studentData.full_name || !studentData.student_id || !studentData.email) {
            showToast('Please fill in all fields', 'error');
            return;
        }
        
        const existingId = document.getElementById('studentId')?.value;
        
        if (existingId && isEditing) {
            // UPDATE - only update allowed fields (course, year_level, status)
            // Do NOT update full_name, student_id, email
            const updateData = {
                course: studentData.course,
                year_level: studentData.year_level,
                status: studentData.status,
                updated_at: studentData.updated_at
            };
            
            const { error } = await supabase
                .from('student')
                .update(updateData)
                .eq('id', existingId);
            
            if (error) {
                showToast('Failed to update student', 'error');
                console.error('Update error:', error);
                return;
            }
            showToast(`✓ ${studentData.full_name} has been updated`, 'success');
            addInternalNotification('Student Updated', `${studentData.full_name}'s info has been modified`, false);
        } else {
            // INSERT new student
            studentData.created_at = new Date().toISOString();
            const { error } = await supabase
                .from('student')
                .insert([studentData]);
            
            if (error) {
                showToast('Failed to add student', 'error');
                console.error('Insert error:', error);
                return;
            }
            showToast(`✓ ${studentData.full_name} has been added`, 'success');
            addInternalNotification('Student Added', `${studentData.full_name} has been added to the system`, false);
        }
        
        await loadStudents();
        resetFormForAdd();
        closeModal();
    });
}

// ========== HELPER FUNCTIONS ==========
function openModal() {
    const modal = document.getElementById('studentModal');
    if (modal) modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('studentModal');
    if (modal) modal.classList.remove('active');
    resetFormForAdd();
    document.getElementById('modalTitle').textContent = 'Add New Student';
    document.body.style.overflow = '';
}

function getInitials(name) {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getYearSuffix(year) {
    const suffixes = { 1: 'st', 2: 'nd', 3: 'rd', 4: 'th' };
    return suffixes[year] || 'th';
}

function formatDate(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

function updateStats() {
    const total = students.length;
    const active = students.filter(s => s.status === 'active').length;
    const totalReports = students.reduce((sum, s) => sum + (s.reports || 0), 0);
    const avgReports = total > 0 ? (totalReports / total).toFixed(1) : 0;
    
    const totalEl = document.getElementById('totalStudents');
    const activeEl = document.getElementById('activeStudents');
    const reportsEl = document.getElementById('totalReports');
    const avgEl = document.getElementById('avgReports');
    
    if (totalEl) totalEl.textContent = total;
    if (activeEl) activeEl.textContent = active;
    if (reportsEl) reportsEl.textContent = totalReports;
    if (avgEl) avgEl.textContent = avgReports;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== NAVIGATION SETUP ==========
function setupNavigation() {
    const drawerItems = document.querySelectorAll('.drawer-item');
    drawerItems.forEach(item => {
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        newItem.addEventListener('click', function() {
            const page = this.dataset.page;
            const drawer = document.getElementById('drawer');
            const overlay = document.getElementById('overlay');
            if (drawer) drawer.classList.remove('open');
            if (overlay) overlay.classList.remove('open');
            
            if (page === 'dashboard') window.location.href = '/Assets/Admin_dashboard/Admin.html';
            else if (page === 'incidents') window.location.href = '/Assets/Admin_dashboard/incident/incident.html';
            else if (page === 'users') window.location.href = '/Assets/Admin_dashboard/user_page/user.html';
            else if (page === 'analytics') window.location.href = '/Assets/Admin_dashboard/analytics/analytics.html';
            else if (page === 'settings') window.location.href = '/Assets/Admin_dashboard/settings/setting.html';
        });
    });
}

// ========== BOTTOM NAVIGATION ==========
function setupBottomNav() {
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    bottomNavItems.forEach(item => {
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        newItem.addEventListener('click', () => {
            const page = newItem.dataset.page;
            if (page === 'dashboard') window.location.href = '/Assets/Admin_dashboard/Admin.html';
            else if (page === 'incidents') window.location.href = '/Assets/Admin_dashboard/incident/incident.html';
            else if (page === 'users') window.location.href = '/Assets/Admin_dashboard/user_page/user.html';
            else if (page === 'analytics') window.location.href = '/Assets/Admin_dashboard/analytics/analytics.html';
            else if (page === 'settings') window.location.href = '/Assets/Admin_dashboard/settings/setting.html';
        });
    });
}

// ========== HIGHLIGHT ACTIVE BOTTOM NAV ==========
function highlightActiveBottomNav() {
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    const currentPath = window.location.pathname;
    
    bottomNavItems.forEach(item => {
        const page = item.dataset.page;
        item.classList.remove('active');
        
        if (page === 'dashboard' && (currentPath.includes('Admin.html') || currentPath === '/' || currentPath.includes('/dashboard'))) {
            item.classList.add('active');
        } 
        else if (page === 'incidents' && currentPath.includes('incident')) {
            item.classList.add('active');
        } 
        else if (page === 'users' && currentPath.includes('user_page')) {
            item.classList.add('active');
        } 
        else if (page === 'analytics' && currentPath.includes('analytics')) {
            item.classList.add('active');
        } 
        else if (page === 'settings' && currentPath.includes('setting')) {
            item.classList.add('active');
        }
    });
}

function setupUI() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('overlay');
    const adminPill = document.getElementById('adminPill');
    const notificationBell = document.getElementById('notificationBell');
    
    if (overlay) overlay.onclick = () => { drawer.classList.remove('open'); overlay.classList.remove('open'); };
    if (adminPill) adminPill.onclick = () => { drawer.classList.toggle('open'); overlay.classList.toggle('open'); };
    if (notificationBell) notificationBell.onclick = (e) => { e.stopPropagation(); toggleNotificationDropdown(); };
    
    const addBtn = document.getElementById('addStudentBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            resetFormForAdd();
            openModal();
        });
    }
    
    const closeBtn = document.getElementById('closeModalBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    
    const modal = document.getElementById('studentModal');
    if (modal) {
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modal && modal.classList.contains('active')) closeModal();
            if (isNotificationDropdownOpen) {
                const dropdown = document.getElementById('notificationDropdown');
                if (dropdown) dropdown.classList.remove('show');
                isNotificationDropdownOpen = false;
            }
        }
    });
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        
        newLogoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('currentStudent');
                localStorage.removeItem('currentAdmin');
                localStorage.removeItem('isAdminLoggedIn');
                showToast('Logged out successfully', 'success');
                setTimeout(() => window.location.href = '/land.html', 500);
            }
        });
    }
}

// ========== AUTO UPDATE STATUS EVERY 30 SECONDS ==========
setInterval(() => {
    updateStudentStatusFromAuth();
    updateAllReportCounts();
}, 30000);

// ========== INITIALIZATION ==========
async function init() {
    console.log('Initializing Student Management...');
    loadAdminToDrawer();
    loadNotifications();
    initDarkMode();
    await loadStudents();
    setupRealtimeSubscription();
    setupNavigation();
    setupBottomNav();
    setupUI();
    highlightActiveBottomNav();
}

init();