// Student Management System - NO SAMPLE DATA EVER
const STUDENTS_STORAGE_KEY = 'campus_care_students';

let students = [];
let currentEditId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeDrawer();
    loadStudents();
    setupEventListeners();
    renderStudentsTable();
    updateStats();
});

// Drawer Functions
function initializeDrawer() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('overlay');
    const hamburger = document.getElementById('hamburger');
    const drawerClose = document.getElementById('drawerClose');
    const adminPill = document.getElementById('adminPill');
    
    window.openDrawer = () => {
        drawer.classList.add('open');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    };
    
    window.closeDrawer = () => {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    };
    
    if (hamburger) hamburger.addEventListener('click', window.openDrawer);
    if (drawerClose) drawerClose.addEventListener('click', window.closeDrawer);
    if (overlay) overlay.addEventListener('click', window.closeDrawer);
    
    if (adminPill) {
        adminPill.addEventListener('click', () => {
            window.openDrawer();
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') window.closeDrawer();
    });
    
    window.addEventListener('resize', () => {
        if (window.innerWidth > 640) window.closeDrawer();
    });
}

// CLEAN LOAD - No sample data EVER
function loadStudents() {
    const stored = localStorage.getItem(STUDENTS_STORAGE_KEY);
    
    if (stored) {
        students = JSON.parse(stored);
        
        // Remove any old sample data (students with IDs less than 1000 are samples)
        const beforeCount = students.length;
        students = students.filter(s => s.id > 1000);
        
        if (beforeCount !== students.length) {
            saveStudents();
            console.log(`Removed ${beforeCount - students.length} sample students`);
        }
    } else {
        // Start COMPLETELY EMPTY
        students = [];
        saveStudents();
    }
}

function saveStudents() {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
}

// Function to add a new student from signup page
window.addNewStudent = function(studentData) {
    const students = getStudents();
    const newStudent = {
        id: Date.now(), // This creates IDs > 1000 (e.g., 1734567890123)
        name: studentData.name,
        idNumber: studentData.idNumber,
        course: studentData.course,
        year: studentData.year,
        email: studentData.email,
        status: 'active',
        dateAdded: new Date().toISOString(),
        password: studentData.password
    };
    students.push(newStudent);
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
    
    localStorage.setItem('currentStudent', JSON.stringify({
        id: newStudent.id,
        name: newStudent.name,
        idNumber: newStudent.idNumber,
        email: newStudent.email
    }));
    
    return newStudent;
};

// Function to verify login
window.verifyStudentLogin = function(idNumber, password) {
    const students = JSON.parse(localStorage.getItem(STUDENTS_STORAGE_KEY) || '[]');
    const student = students.find(s => s.idNumber === idNumber && s.password === password);
    
    if (student) {
        localStorage.setItem('currentStudent', JSON.stringify({
            id: student.id,
            name: student.name,
            idNumber: student.idNumber,
            email: student.email
        }));
        return true;
    }
    return false;
};

function getStudents() {
    const stored = localStorage.getItem(STUDENTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

function getStudentReports() {
    const reports = JSON.parse(localStorage.getItem('campus_care_reports') || '[]');
    return reports;
}

function updateStats() {
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.status === 'active').length;
    const allReports = getStudentReports();
    const totalReports = allReports.length;
    const avgReports = totalStudents > 0 ? (totalReports / totalStudents).toFixed(1) : 0;
    
    const totalEl = document.getElementById('totalStudents');
    const activeEl = document.getElementById('activeStudents');
    const reportsEl = document.getElementById('totalReports');
    const avgEl = document.getElementById('avgReports');
    
    if (totalEl) totalEl.textContent = totalStudents;
    if (activeEl) activeEl.textContent = activeStudents;
    if (reportsEl) reportsEl.textContent = totalReports;
    if (avgEl) avgEl.textContent = avgReports;
}

function renderStudentsTable() {
    const tbody = document.getElementById('studentsTableBody');
    if (!tbody) return;
    
    if (students.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 60px;">
                    <div class="empty-state">
                        <div class="empty-icon">👨‍🎓</div>
                        <div class="empty-title">No students registered yet</div>
                        <div style="font-size: 13px; color: var(--muted);">Students will appear here once they sign up</div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    const reports = getStudentReports();
    
    tbody.innerHTML = students.map(student => {
        const studentReports = reports.filter(r => r.studentName === student.name);
        const reportCount = studentReports.length;
        
        return `
            <tr data-student-id="${student.id}">
                <td>
                    <div class="student-info">
                        <div class="student-avatar">${getInitials(student.name)}</div>
                        <div>
                            <div class="student-name">${escapeHtml(student.name)}</div>
                            <div class="student-id">${escapeHtml(student.email)}</div>
                        </div>
                    </div>
                </td>
                <td><strong>${escapeHtml(student.idNumber)}</strong></td>
                <td>${escapeHtml(student.course)}</td>
                <td>${student.year}${getYearSuffix(student.year)} Year</td>
                <td>
                    <span class="badge" style="background: var(--blue-light); color: var(--blue);">
                        ${reportCount} reports
                    </span>
                </td>
                <td>
                    <span class="${student.status === 'active' ? 'badge-active' : 'badge-inactive'}">
                        ${student.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>
                    <div class="action-btns">
                        <button class="action-btn" onclick="editStudent(${student.id})" title="Edit">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="action-btn del" onclick="deleteStudent(${student.id})" title="Delete">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function getYearSuffix(year) {
    const suffixes = {1: 'st', 2: 'nd', 3: 'rd', 4: 'th'};
    return suffixes[year] || 'th';
}

function setupEventListeners() {
    const addBtn = document.getElementById('addStudentBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => openModal());
    }
    
    const closeModal = document.getElementById('closeModal');
    if (closeModal) closeModal.addEventListener('click', () => closeModalWindow());
    
    const modalOverlay = document.getElementById('studentModal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModalWindow();
        });
    }
    
    const studentForm = document.getElementById('studentForm');
    if (studentForm) {
        studentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveStudent();
        });
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
}

function openModal(editId = null) {
    const modal = document.getElementById('studentModal');
    const modalTitle = document.getElementById('modalTitle');
    
    if (!modal) return;
    
    if (editId) {
        currentEditId = editId;
        const student = students.find(s => s.id === editId);
        if (student) {
            modalTitle.textContent = 'Edit Student';
            document.getElementById('studentId').value = student.id;
            document.getElementById('studentFullName').value = student.name;
            document.getElementById('studentIdNumber').value = student.idNumber;
            document.getElementById('studentCourse').value = student.course;
            document.getElementById('studentYear').value = student.year;
            document.getElementById('studentEmail').value = student.email;
            document.getElementById('studentStatus').value = student.status;
        }
    } else {
        currentEditId = null;
        modalTitle.textContent = 'Add New Student';
        document.getElementById('studentForm').reset();
        document.getElementById('studentId').value = '';
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModalWindow() {
    const modal = document.getElementById('studentModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    currentEditId = null;
}

function saveStudent() {
    const studentData = {
        name: document.getElementById('studentFullName').value,
        idNumber: document.getElementById('studentIdNumber').value,
        course: document.getElementById('studentCourse').value,
        year: document.getElementById('studentYear').value,
        email: document.getElementById('studentEmail').value,
        status: document.getElementById('studentStatus').value
    };
    
    if (currentEditId) {
        const index = students.findIndex(s => s.id === currentEditId);
        if (index !== -1) {
            students[index] = { ...students[index], ...studentData };
        }
    } else {
        // Use Date.now() for unique ID > 1000
        const newId = Date.now();
        students.push({
            id: newId,
            ...studentData,
            dateAdded: new Date().toISOString()
        });
    }
    
    saveStudents();
    renderStudentsTable();
    updateStats();
    closeModalWindow();
    showNotification(currentEditId ? 'Student updated successfully!' : 'Student added successfully!');
}

function editStudent(id) {
    openModal(id);
}

function deleteStudent(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;
    
    if (confirm(`Are you sure you want to delete ${student.name}?`)) {
        students = students.filter(s => s.id !== id);
        saveStudents();
        renderStudentsTable();
        updateStats();
        showNotification('Student deleted successfully!');
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        showNotification('Logged out successfully');
        setTimeout(() => {
            window.location.href = '/LANDING PAGE/land.html';
        }, 1000);
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: var(--teal);
        color: white;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 500;
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add animation styles
if (!document.querySelector('style[data-animations]')) {
    const style = document.createElement('style');
    style.setAttribute('data-animations', 'true');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
        
        @media (max-width: 640px) {
            .users-section { padding: 16px !important; }
            .page-header { padding: 20px !important; }
            .page-title { font-size: 20px !important; }
            .stats-row { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
            .stat-card { padding: 12px !important; }
            .stat-number { font-size: 22px !important; }
            .stat-icon { width: 36px !important; height: 36px !important; }
            .section-hdr { flex-direction: column; align-items: flex-start; }
            .add-student-btn { width: 100%; justify-content: center; }
            td { padding: 10px 12px !important; }
            .student-avatar { width: 32px !important; height: 32px !important; font-size: 12px !important; }
            .student-name { font-size: 12px !important; }
            .action-btn { width: 28px !important; height: 28px !important; }
        }
        
        @media (min-width: 641px) and (max-width: 900px) {
            .users-section { padding: 24px !important; }
            .stats-row { gap: 12px !important; }
        }
    `;
    document.head.appendChild(style);
}