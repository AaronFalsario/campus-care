// ========== STUDENT MANAGEMENT SYSTEM ==========
let students = [];
let editingStudentId = null;
let currentAdmin = null;

// Supabase configuration
const supabaseUrl = 'https://opjyksksnccurdwyskiu.supabase.co';
const supabaseKey = 'sb_publishable_l7mKNQVJ6WesiTM4GJCxQg_oXxTN3it';
const supabase = window.supabase || null;

// ============ LOAD ADMIN PROFILE ============
function loadAdminProfile() {
    try {
        const storedAdmin = localStorage.getItem('currentAdmin');
        const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
        
        if (!storedAdmin || isLoggedIn !== 'true') {
            window.location.href = '/Assets/login/admin/admin.html';
            return false;
        }
        
        currentAdmin = JSON.parse(storedAdmin);
        const adminName = currentAdmin.name || currentAdmin.email;
        
        const drawerName = document.querySelector('.drawer-name');
        const drawerRole = document.querySelector('.drawer-role');
        const adminPill = document.getElementById('adminPill');
        const drawerAvatar = document.querySelector('.drawer-avatar');
        
        if (drawerName) {
            drawerName.textContent = adminName;
            drawerName.style.color = 'white';
        }
        if (drawerRole) drawerRole.textContent = currentAdmin.role || 'Campus Care Admin';
        if (adminPill) adminPill.textContent = adminName.split(' ')[0] || 'Admin';
        if (drawerAvatar) {
            const initials = adminName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            drawerAvatar.innerHTML = `<span style="font-size: 16px; font-weight: 600; color: white;">${initials}</span>`;
        }
        
        return true;
    } catch (error) {
        console.error('Error loading admin profile:', error);
        return false;
    }
}

// ============ LOAD STUDENTS ============
async function loadStudents() {
    try {
        const stored = localStorage.getItem('campus_care_students');
        
        if (stored && stored !== '[]') {
            students = JSON.parse(stored);
            console.log('Loaded students from localStorage:', students.length);
        } else {
            students = getDefaultStudents();
            saveToLocalStorage();
        }
        
        autoUpdateInactiveStatus();
        renderStudents();
        updateStats();
        
    } catch (error) {
        console.error('Error loading students:', error);
        students = getDefaultStudents();
        renderStudents();
        updateStats();
    }
}

// ============ AUTO UPDATE INACTIVE STATUS ============
function autoUpdateInactiveStatus() {
    const now = new Date();
    let hasChanges = false;
    
    students.forEach(student => {
        if (student.status === 'active' && student.last_login) {
            const lastLogin = new Date(student.last_login);
            const daysSinceLogin = (now - lastLogin) / (1000 * 60 * 60 * 24);
            
            if (daysSinceLogin > 7) {
                student.status = 'inactive';
                hasChanges = true;
                console.log(`Auto-marked ${student.name} as inactive`);
            }
        }
    });
    
    if (hasChanges) {
        saveToLocalStorage();
    }
}

// ============ DEFAULT STUDENTS ============
function getDefaultStudents() {
    return [
        { 
            id: '1', 
            name: "Test001", 
            idNumber: "202701023", 
            email: "202701023@gordoncollege.edu.ph",
            course: "BSCS", 
            year: "3", 
            status: "active", 
            reports: 2,
            last_login: new Date().toISOString(),
            created_at: "2026-04-27T14:11:20.275Z"
        },
        { 
            id: '2', 
            name: "ambatublow", 
            idNumber: "202410213", 
            email: "202410213@gordoncollege.edu.ph",
            course: "BSIT", 
            year: "2", 
            status: "inactive", 
            reports: 1,
            last_login: "2026-04-27T13:55:00.541Z",
            created_at: "2026-04-27T13:55:00.541Z"
        },
        { 
            id: '3', 
            name: "Barcoma Kyle renz", 
            idNumber: "202411615", 
            email: "202411615@gordoncollege.edu.ph",
            course: "BSECE", 
            year: "4", 
            status: "active", 
            reports: 3,
            last_login: new Date().toISOString(),
            created_at: "2026-04-27T07:42:40.904Z"
        }
    ];
}

// ============ SAVE TO LOCAL STORAGE ============
function saveToLocalStorage() {
    localStorage.setItem('campus_care_students', JSON.stringify(students));
}

// ============ RENDER STUDENTS TABLE ============
function renderStudents() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;
    
    if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-state"><div class="empty-icon">👨‍🎓</div><div class="empty-title">No students yet</div><div>Students will appear here</div></td></td>`;
        return;
    }
    
    tbody.innerHTML = students.map(student => `
        <tr data-id="${student.id}">
            <td><div class="student-info"><div class="student-avatar">${getInitials(student.name)}</div><div><div class="student-name">${escapeHtml(student.name)}</div><div class="student-detail">${escapeHtml(student.email)}</div></div></div></td>
            <td><strong>${escapeHtml(student.idNumber)}</strong></td>
            <td>${escapeHtml(student.course)} - ${student.year}${getYearSuffix(student.year)} Year</span></td>
            <td><span class="badge-active">${student.reports || 0} reports</span></td>
            <td><span class="status-badge ${student.status === 'active' ? 'status-active' : 'status-inactive'}">
                ${student.status === 'active' ? '🟢 Active' : '⚫ Inactive'}
            </span></td>
            <td><span class="last-login">${formatDate(student.last_login)}</span></td>
            <td><div class="action-btns">
                <button class="action-btn edit-student" data-id="${student.id}" title="Edit Student">✏️</button>
                <button class="action-btn toggle-status" data-id="${student.id}" title="Toggle Status">🔄</button>
                <button class="action-btn del delete-student" data-id="${student.id}" title="Delete Student">🗑️</button>
             </div></td>
        </tr>
    `).join('');
    
    // Attach event listeners
    document.querySelectorAll('.edit-student').forEach(btn => {
        btn.removeEventListener('click', () => {});
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            editStudent(btn.dataset.id);
        });
    });
    
    document.querySelectorAll('.delete-student').forEach(btn => {
        btn.removeEventListener('click', () => {});
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            deleteStudent(btn.dataset.id);
        });
    });
    
    document.querySelectorAll('.toggle-status').forEach(btn => {
        btn.removeEventListener('click', () => {});
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleStudentStatus(btn.dataset.id);
        });
    });
}

// ============ TOGGLE STUDENT STATUS ============
function toggleStudentStatus(id) {
    const student = students.find(s => s.id == id);
    if (student) {
        student.status = student.status === 'active' ? 'inactive' : 'active';
        saveToLocalStorage();
        renderStudents();
        updateStats();
        showNotification(`${student.name} is now ${student.status}`, 'success');
    }
}

// ============ HELPER FUNCTIONS ============
function getInitials(name) { 
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); 
}

function getYearSuffix(year) { 
    return { 1: 'st', 2: 'nd', 3: 'rd', 4: 'th' }[year] || 'th'; 
}

function formatDate(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now - date) / 3600000);
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
}

// ============ UPDATE STATS ============
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

// ============ SHOW NOTIFICATION ============
function showNotification(message, type = 'info') {
    const n = document.createElement('div');
    n.textContent = message;
    n.style.cssText = `position:fixed;bottom:20px;right:20px;background:${type === 'success' ? '#10B981' : type === 'error' ? '#DC2626' : '#1E3A5F'};color:white;padding:10px 18px;border-radius:40px;z-index:2000;box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

// ============ ADD CSS FOR STATUS BADGES ============
function addStatusStyles() {
    if (document.getElementById('student-status-styles')) return;
    const style = document.createElement('style');
    style.id = 'student-status-styles';
    style.textContent = `
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            border-radius: 30px;
            font-size: 11px;
            font-weight: 600;
        }
        .status-active {
            background: #d1fae5;
            color: #065f46;
        }
        .status-inactive {
            background: #f1f5f9;
            color: #475569;
        }
        .action-btn {
            cursor: pointer;
            padding: 6px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            background: white;
            transition: all 0.2s;
        }
        .action-btn:hover {
            background: #f1f5f9;
            transform: scale(1.05);
        }
        .badge-active {
            background: #E1F5EE;
            color: #085041;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            display: inline-block;
        }
    `;
    document.head.appendChild(style);
}

// ============ MODAL FUNCTIONS ============
function openModal() { 
    const modal = document.getElementById('studentModal');
    if (modal) modal.classList.add('active'); 
    document.body.style.overflow = 'hidden'; 
}

function closeModal() {
    const modal = document.getElementById('studentModal');
    if (modal) modal.classList.remove('active');
    const form = document.getElementById('studentForm');
    if (form) form.reset();
    const studentId = document.getElementById('studentId');
    if (studentId) studentId.value = '';
    editingStudentId = null;
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = 'Add New Student';
    document.body.style.overflow = '';
}

function editStudent(id) {
    const student = students.find(s => s.id == id);
    if (!student) return;
    editingStudentId = id;
    const studentIdInput = document.getElementById('studentId');
    const fullNameInput = document.getElementById('studentFullName');
    const idNumberInput = document.getElementById('studentIdNumber');
    const courseSelect = document.getElementById('studentCourse');
    const yearSelect = document.getElementById('studentYear');
    const emailInput = document.getElementById('studentEmail');
    const statusSelect = document.getElementById('studentStatus');
    const modalTitle = document.getElementById('modalTitle');
    
    if (studentIdInput) studentIdInput.value = student.id;
    if (fullNameInput) fullNameInput.value = student.name;
    if (idNumberInput) idNumberInput.value = student.idNumber;
    if (courseSelect) courseSelect.value = student.course;
    if (yearSelect) yearSelect.value = student.year;
    if (emailInput) emailInput.value = student.email;
    if (statusSelect) statusSelect.value = student.status;
    if (modalTitle) modalTitle.textContent = 'Edit Student';
    openModal();
}

function deleteStudent(id) {
    const student = students.find(s => s.id == id);
    if (!student) return;
    if (confirm(`Are you sure you want to delete "${student.name}"?`)) {
        students = students.filter(s => s.id != id);
        saveToLocalStorage();
        renderStudents();
        updateStats();
        showNotification(`✓ ${student.name} has been deleted`, 'success');
    }
}

// ============ FORM SUBMIT ============
const studentForm = document.getElementById('studentForm');
if (studentForm) {
    studentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const studentData = {
            name: document.getElementById('studentFullName')?.value.trim() || '',
            idNumber: document.getElementById('studentIdNumber')?.value.trim() || '',
            course: document.getElementById('studentCourse')?.value || 'N/A',
            year: document.getElementById('studentYear')?.value || '1',
            email: document.getElementById('studentEmail')?.value.trim() || '',
            status: document.getElementById('studentStatus')?.value || 'active',
            reports: 0,
            last_login: new Date().toISOString()
        };
        
        if (!studentData.name || !studentData.idNumber || !studentData.email) {
            showNotification('Please fill in all fields', 'error');
            return;
        }
        
        const existingId = document.getElementById('studentId')?.value;
        
        if (existingId) {
            const index = students.findIndex(s => s.id == existingId);
            if (index !== -1) {
                students[index] = { ...students[index], ...studentData };
                showNotification(`✓ ${studentData.name} has been updated`, 'success');
            }
        } else {
            const newId = Date.now().toString();
            students.push({ ...studentData, id: newId });
            showNotification(`✓ ${studentData.name} has been added`, 'success');
        }
        
        saveToLocalStorage();
        renderStudents();
        updateStats();
        closeModal();
    });
}

// ============ FIXED: NAVIGATION & UI SETUP ============
function setupNavigation() {
    console.log('Setting up navigation...');
    
    // Drawer navigation
    const drawerItems = document.querySelectorAll('.drawer-item');
    console.log('Found drawer items:', drawerItems.length);
    
    drawerItems.forEach(item => {
        // Clone to remove existing listeners
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        newItem.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            console.log('Drawer clicked:', page);
            
            // Close drawer first
            const drawer = document.getElementById('drawer');
            const overlay = document.getElementById('overlay');
            if (drawer) drawer.classList.remove('open');
            if (overlay) overlay.classList.remove('open');
            
            // Navigate
            if (page === 'dashboard') {
                window.location.href = '/Assets/Admin_dashboard/Admin.html';
            } else if (page === 'incidents') {
                window.location.href = '/Assets/Admin_dashboard/incident/incident.html';
            } else if (page === 'settings') {
                window.location.href = '/Assets/Admin_dashboard/settings/setting.html';
            }
            // users page - stay here
        });
    });
}

// ============ BOTTOM NAVIGATION ============
function setupBottomNav() {
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    console.log('Bottom nav items:', bottomNavItems.length);
    
    bottomNavItems.forEach(item => {
        // Clone to remove existing listeners
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        newItem.addEventListener('click', (e) => {
            e.preventDefault();
            const page = newItem.getAttribute('data-page');
            console.log('Bottom nav clicked:', page);
            
            if (page === 'dashboard') {
                window.location.href = '/Assets/Admin_dashboard/Admin.html';
            } else if (page === 'incidents') {
                window.location.href = '/Assets/Admin_dashboard/incident/incident.html';
            } else if (page === 'settings') {
                window.location.href = '/Assets/Admin_dashboard/settings/setting.html';
            }
            // users page - stay here
        });
    });
}

function setupUI() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('overlay');
    const hamburger = document.getElementById('hamburger');
    const adminPill = document.getElementById('adminPill');
    
    if (hamburger) {
        hamburger.onclick = () => { 
            if (drawer) drawer.classList.toggle('open'); 
            if (overlay) overlay.classList.toggle('open'); 
        };
    }
    if (overlay) {
        overlay.onclick = () => { 
            if (drawer) drawer.classList.remove('open'); 
            if (overlay) overlay.classList.remove('open'); 
        };
    }
    if (adminPill) {
        adminPill.onclick = () => { 
            if (drawer) drawer.classList.toggle('open'); 
            if (overlay) overlay.classList.toggle('open'); 
        };
    }
    
    const addBtn = document.getElementById('addStudentBtn');
    if (addBtn) addBtn.addEventListener('click', openModal);
    
    const closeBtn = document.getElementById('closeModalBtn');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    
    const modal = document.getElementById('studentModal');
    if (modal) {
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    }
    
    document.addEventListener('keydown', (e) => { 
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) closeModal(); 
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
                showNotification('Logged out successfully', 'success');
                setTimeout(() => {
                    window.location.href = '/Assets/Landing_page/land.html';
                }, 500);
            }
        });
    }
}

function escapeHtml(text) { 
    if (!text) return ''; 
    const div = document.createElement('div'); 
    div.textContent = text; 
    return div.innerHTML; 
}

// ============ AUTO REFRESH EVERY 30 SECONDS ============
let refreshInterval = setInterval(() => {
    autoUpdateInactiveStatus();
    renderStudents();
    updateStats();
}, 30000);

// ============ INITIALIZE ============
async function init() {
    console.log('Initializing Student Management...');
    addStatusStyles();
    loadAdminProfile();
    await loadStudents();
    setupNavigation();
    setupBottomNav();
    setupUI();
}

// Start the application
init();