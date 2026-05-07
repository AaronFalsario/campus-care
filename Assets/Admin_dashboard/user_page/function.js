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
            notificationIdCounter = notifications.length > 0
                ? Math.max(...notifications.map(n => n.id)) + 1
                : 0;
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
        title,
        message,
        timestamp: new Date().toISOString(),
        read: false,
        isUrgent
    };
    notifications.unshift(notification);
    if (notifications.length > 50) notifications = notifications.slice(0, 50);
    saveNotifications();
    updateNotificationDropdown();
}

function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const urgentCount = notifications.filter(n => !n.read && n.isUrgent).length;
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = urgentCount > 0 ? `🔥${unreadCount}` : (unreadCount > 9 ? '9+' : unreadCount);
            badge.style.display = 'flex';
            badge.style.background = urgentCount > 0 ? '#DC2626' : 'var(--red)';
            badge.style.animation = urgentCount > 0 ? 'pulse 0.5s ease infinite' : 'none';
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
                <div class="notification-dropdown-item ${!notif.read ? 'unread' : ''} ${notif.isUrgent ? 'urgent' : ''}"
                     onclick="markNotificationRead(${notif.id})">
                    <div class="notification-dropdown-title">${notif.isUrgent ? '🚨 ' : '📋 '}${escapeHtml(notif.title)}</div>
                    <div class="notification-dropdown-message">${escapeHtml(notif.message)}</div>
                    <div class="notification-dropdown-time">${getTimeAgo(notif.timestamp)}</div>
                </div>
            `).join('')}
        </div>
        ${notifications.length > 15
            ? `<div class="notification-dropdown-footer">${notifications.length - 15} more notifications</div>`
            : ''}
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

window.markNotificationRead = function (id) {
    const notif = notifications.find(n => n.id === id);
    if (notif) {
        notif.read = true;
        saveNotifications();
        updateNotificationDropdown();
    }
};

window.clearAllNotifications = function () {
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
// A student is ACTIVE if:
//   - They have a last_login timestamp
//   - They have NOT logged out after that login (last_logout < last_login or no logout)
//   - Their last_login was within the past 30 minutes
// As soon as a student logs in, last_login is updated → they become active instantly.
async function updateStudentStatusFromAuth() {
    try {
        const now = new Date();
        let hasChanges = false;

        for (const student of students) {
            const lastLogin = student.last_login ? new Date(student.last_login) : null;
            const lastLogout = student.last_logout ? new Date(student.last_logout) : null;

            let isActive = false;

            if (!lastLogin) {
                // Never logged in → inactive
                isActive = false;
            } else if (lastLogout && lastLogout > lastLogin) {
                // Logged out after last login → inactive
                isActive = false;
            } else {
                // Logged in and not logged out → active if within 30 min
                const minutesSinceLogin = (now - lastLogin) / (1000 * 60);
                isActive = minutesSinceLogin < 30;
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
        }
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

// ========== GET STUDENT REPORT COUNT ==========
async function getStudentReportCount(studentIdNumber) {
    try {
        const { count, error } = await supabase
            .from('incident')
            .select('*', { count: 'exact', head: true })
            .eq('student_id_number', studentIdNumber);

        if (error) return 0;
        return count || 0;
    } catch {
        return 0;
    }
}

// ========== LOAD STUDENTS FROM SUPABASE ==========
async function loadStudents() {
    try {
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
// Listens for changes to the student table — including last_login updates
// so the admin dashboard reflects active status the moment a student logs in.
function setupRealtimeSubscription() {
    if (realtimeSubscription) return;

    realtimeSubscription = supabase
        .channel('student-management-changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'student' },
            async (payload) => {
                console.log('Real-time student update:', payload.eventType);

                if (payload.eventType === 'INSERT') {
                    addInternalNotification(
                        'New Student Registered',
                        `${payload.new.full_name} has created an account`,
                        false
                    );
                    showToast('📢 New student registered!', 'info');
                }

                // On UPDATE: if last_login changed, mark student active immediately
                if (payload.eventType === 'UPDATE') {
                    const updated = payload.new;
                    const student = students.find(s => s.id === updated.id);
                    if (student) {
                        const prevLogin = student.last_login;
                        student.last_login = updated.last_login;
                        student.last_logout = updated.last_logout;

                        // If last_login just changed and no logout after it → set active
                        if (
                            updated.last_login &&
                            updated.last_login !== prevLogin &&
                            (!updated.last_logout || new Date(updated.last_logout) < new Date(updated.last_login))
                        ) {
                            student.status = 'active';
                            await supabase
                                .from('student')
                                .update({ status: 'active' })
                                .eq('id', student.id);

                            renderStudents();
                            updateStats();
                            return; // skip full reload for performance
                        }
                    }
                }

                await loadStudents();
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

// ========== EDIT STUDENT ==========
// Only allows editing Status — Name, ID Number, and Email are read-only.
// Course and Year fields have been removed from the modal.
function editStudent(id) {
    const student = students.find(s => s.id == id);
    if (!student) return;

    editingStudentId = id;

    // Populate fields
    document.getElementById('studentId').value = student.id;
    document.getElementById('studentFullName').value = student.name;
    document.getElementById('studentIdNumber').value = student.idNumber;
    document.getElementById('studentEmail').value = student.email;
    document.getElementById('studentStatus').value = student.status;

    // Lock read-only fields
    ['studentFullName', 'studentIdNumber', 'studentEmail'].forEach(fieldId => {
        const el = document.getElementById(fieldId);
        if (el) {
            el.disabled = true;
            el.style.opacity = '0.6';
            el.style.cursor = 'not-allowed';
        }
    });

    document.getElementById('modalTitle').textContent = 'Edit Student';
    openModal();
}

// ========== RESET FORM ==========
function resetFormForAdd() {
    // Re-enable all fields
    ['studentFullName', 'studentIdNumber', 'studentEmail'].forEach(fieldId => {
        const el = document.getElementById(fieldId);
        if (el) {
            el.disabled = false;
            el.style.opacity = '1';
            el.style.cursor = '';
        }
    });

    const form = document.getElementById('studentForm');
    if (form) form.reset();

    const studentIdInput = document.getElementById('studentId');
    if (studentIdInput) studentIdInput.value = '';

    editingStudentId = null;
}

// ========== FORM SUBMIT ==========
document.addEventListener('DOMContentLoaded', () => {
    const studentForm = document.getElementById('studentForm');
    if (studentForm) {
        studentForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const isEditing = editingStudentId !== null;

            const fullName = document.getElementById('studentFullName')?.value.trim() || '';
            const studentId = document.getElementById('studentIdNumber')?.value.trim() || '';
            const email = document.getElementById('studentEmail')?.value.trim() || '';
            const status = document.getElementById('studentStatus')?.value || 'inactive';
            const existingId = document.getElementById('studentId')?.value;

            if (!fullName || !studentId || !email) {
                showToast('Please fill in all required fields', 'error');
                return;
            }

            if (isEditing && existingId) {
                // UPDATE — only status is editable
                const { error } = await supabase
                    .from('student')
                    .update({ status, updated_at: new Date().toISOString() })
                    .eq('id', existingId);

                if (error) {
                    showToast('Failed to update student', 'error');
                    console.error('Update error:', error);
                    return;
                }

                showToast(`✓ ${fullName} has been updated`, 'success');
                addInternalNotification('Student Updated', `${fullName}'s status has been changed to ${status}`, false);
            } else {
                // INSERT new student
                const { error } = await supabase
                    .from('student')
                    .insert([{
                        full_name: fullName,
                        student_id: studentId,
                        email,
                        status,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }]);

                if (error) {
                    showToast('Failed to add student', 'error');
                    console.error('Insert error:', error);
                    return;
                }

                showToast(`✓ ${fullName} has been added`, 'success');
                addInternalNotification('Student Added', `${fullName} has been added to the system`, false);
            }

            await loadStudents();
            resetFormForAdd();
            closeModal();
        });
    }
});

// ========== MODAL HELPERS ==========
function openModal() {
    const modal = document.getElementById('studentModal');
    if (modal) modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('studentModal');
    if (modal) modal.classList.remove('active');
    resetFormForAdd();
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = 'Add New Student';
    document.body.style.overflow = '';
}

// ========== HELPER FUNCTIONS ==========
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

    const el = (id) => document.getElementById(id);
    if (el('totalStudents')) el('totalStudents').textContent = total;
    if (el('activeStudents')) el('activeStudents').textContent = active;
    if (el('totalReports')) el('totalReports').textContent = totalReports;
    if (el('avgReports')) el('avgReports').textContent = avgReports;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== NAVIGATION SETUP ==========
function setupNavigation() {
    document.querySelectorAll('.drawer-item').forEach(item => {
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        newItem.addEventListener('click', function () {
            const page = this.dataset.page;
            document.getElementById('drawer')?.classList.remove('open');
            document.getElementById('overlay')?.classList.remove('open');
            navigateTo(page);
        });
    });
}

function setupBottomNav() {
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        newItem.addEventListener('click', () => navigateTo(newItem.dataset.page));
    });
}

function navigateTo(page) {
    const routes = {
        dashboard: '/Assets/Admin_dashboard/Admin.html',
        incidents: '/Assets/Admin_dashboard/incident/incident.html',
        users:     '/Assets/Admin_dashboard/user_page/user.html',
        analytics: '/Assets/Admin_dashboard/analytics/analytics.html',
        settings:  '/Assets/Admin_dashboard/settings/setting.html'
    };
    if (routes[page]) window.location.href = routes[page];
}

function highlightActiveBottomNav() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        const page = item.dataset.page;
        item.classList.remove('active');
        if (
            (page === 'dashboard' && (currentPath.includes('Admin.html') || currentPath === '/')) ||
            (page === 'incidents' && currentPath.includes('incident')) ||
            (page === 'users' && currentPath.includes('user_page')) ||
            (page === 'analytics' && currentPath.includes('analytics')) ||
            (page === 'settings' && currentPath.includes('setting'))
        ) {
            item.classList.add('active');
        }
    });
}

// ========== UI SETUP ==========
function setupUI() {
    const drawer  = document.getElementById('drawer');
    const overlay = document.getElementById('overlay');
    const adminPill = document.getElementById('adminPill');
    const notificationBell = document.getElementById('notificationBell');

    if (overlay) overlay.onclick = () => { drawer?.classList.remove('open'); overlay.classList.remove('open'); };
    if (adminPill) adminPill.onclick = () => { drawer?.classList.toggle('open'); overlay?.classList.toggle('open'); };
    if (notificationBell) notificationBell.onclick = (e) => { e.stopPropagation(); toggleNotificationDropdown(); };

    // Add Student button
    const addBtn = document.getElementById('addStudentBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            resetFormForAdd();
            document.getElementById('modalTitle').textContent = 'Add New Student';
            openModal();
        });
    }

    // Close modal button
    const closeBtn = document.getElementById('closeModalBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Click outside modal to close
    const modal = document.getElementById('studentModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modal?.classList.contains('active')) closeModal();
            if (isNotificationDropdownOpen) {
                document.getElementById('notificationDropdown')?.classList.remove('show');
                isNotificationDropdownOpen = false;
            }
        }
    });

    // Logout
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

// ========== AUTO REFRESH EVERY 30 SECONDS ==========
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