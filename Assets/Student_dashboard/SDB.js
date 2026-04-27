// Student Dashboard JavaScript
const STORAGE_KEY = 'campus_care_reports';
const CURRENT_STUDENT = {
    name: 'Student',
    id: 'student_001'   
};

let currentFilter = 'all';
let currentPage = 'dashboard';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadStudentFromLogin(); // NEW: Load student name from login
    loadProfileImage(); // NEW: Load saved profile image
    initializeDrawer();
    transformReportButtonToStudentButton();
    loadAndDisplayReports();
    setupEventListeners();
    updateStats();
    setupDrawerReportButton(); // NEW: Make drawer "Report new incident" functional
    setupAvatarUpload(); // NEW: Make profile image clickable
    
    // Force stats update after 1 second to ensure everything is loaded
    setTimeout(() => {
        updateStats();
    }, 500);
});

// NEW: Load student name from login page
function loadStudentFromLogin() {
    const savedStudent = localStorage.getItem('currentStudent');
    if (savedStudent) {
        try {
            const studentData = JSON.parse(savedStudent);
            CURRENT_STUDENT.name = studentData.name || 'Lebron James';
            CURRENT_STUDENT.id = studentData.id || 'student_001';
        } catch(e) {
            console.error('Error loading student data:', e);
        }
    }
    
    // Update all instances of student name in the UI
    const studentNameElements = document.querySelectorAll('#studentName, .drawer-name');
    studentNameElements.forEach(el => {
        if (el) el.textContent = CURRENT_STUDENT.name;
    });
    
    // Update welcome message if exists
    const welcomeHeader = document.querySelector('.welcome-header h1');
    if (welcomeHeader) {
        const firstName = CURRENT_STUDENT.name.split(' ')[0];
        welcomeHeader.innerHTML = `Welcome back, ${firstName}`;
    }
}

// NEW: Setup profile image upload functionality
function setupAvatarUpload() {
    const avatarContainer = document.querySelector('.avatar-circle, .profile-image-area .avatar-circle');
    const editHint = document.querySelector('.edit-avatar-hint');
    
    if (!avatarContainer) return;
    
    // Create file input if it doesn't exist
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
                    saveProfileImage(imageData);
                    updateAvatarDisplay(imageData);
                    showNotification('Profile picture updated successfully!');
                };
                reader.readAsDataURL(file);
            } else {
                showNotification('Please select a valid image file (JPEG, PNG)', 'error');
            }
            fileInput.value = '';
        });
    }
    
    // Make avatar clickable
    avatarContainer.style.cursor = 'pointer';
    avatarContainer.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
    
    // Make edit hint clickable if exists
    if (editHint) {
        editHint.style.cursor = 'pointer';
        editHint.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
    }
}

// NEW: Save profile image to localStorage
function saveProfileImage(imageData) {
    localStorage.setItem(`profile_image_${CURRENT_STUDENT.id}`, imageData);
}

// NEW: Load profile image from localStorage
function loadProfileImage() {
    const savedImage = localStorage.getItem(`profile_image_${CURRENT_STUDENT.id}`);
    if (savedImage) {
        updateAvatarDisplay(savedImage);
    }
}

// NEW: Update avatar display
function updateAvatarDisplay(imageData) {
    const avatarContainer = document.querySelector('.avatar-circle, .profile-image-area .avatar-circle');
    if (!avatarContainer) return;
    
    if (imageData) {
        // Remove existing content and add image
        avatarContainer.innerHTML = '';
        const img = document.createElement('img');
        img.src = imageData;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '50%';
        avatarContainer.appendChild(img);
    } else {
        // Show initials if no image
        const initials = CURRENT_STUDENT.name.split(' ').map(n => n[0]).join('').toUpperCase();
        avatarContainer.innerHTML = `<span style="font-size: 32px; font-weight: 600;">${initials}</span>`;
    }
}

// NEW: Setup drawer "Report new incident" button functionality
function setupDrawerReportButton() {
    // Find the "Report new incident" drawer item
    const reportNavItem = Array.from(document.querySelectorAll('.drawer-item')).find(
        item => item.textContent.includes('Report new incident') || item.getAttribute('data-page') === 'newreport'
    );
    
    if (reportNavItem) {
        // Remove any existing click listeners and add new one
        const newReportItem = reportNavItem.cloneNode(true);
        reportNavItem.parentNode.replaceChild(newReportItem, reportNavItem);
        
        newReportItem.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Close drawer first
            if (window.closeDrawer) window.closeDrawer();
            
            // Navigate to reporting page
            // Store current student data before navigating
            localStorage.setItem('currentStudent', JSON.stringify({
                name: CURRENT_STUDENT.name,
                id: CURRENT_STUDENT.id
            }));
            
            // Redirect to reporting page
            // Update this URL to match your actual reporting page URL
            const reportingUrl = 'http://127.0.0.1:5500/LANDING%20PAGE/report.html';
            window.location.href = reportingUrl;
        });
    }
    
    // Also handle any "Report Incident" buttons in the drawer footer or elsewhere
    const allReportButtons = document.querySelectorAll('.drawer-item, [data-page="newreport"], .drawer-nav .drawer-item');
    allReportButtons.forEach(btn => {
        if (btn.textContent.includes('Report') || btn.textContent.includes('incident')) {
            btn.addEventListener('click', (e) => {
                if (btn.getAttribute('data-handled') !== 'true') {
                    e.preventDefault();
                    if (window.closeDrawer) window.closeDrawer();
                    localStorage.setItem('currentStudent', JSON.stringify({
                        name: CURRENT_STUDENT.name,
                        id: CURRENT_STUDENT.id
                    }));
                    window.location.href = '/Assets/Student_reporting/report.html';
                }
            });
        }
    });
}

function transformReportButtonToStudentButton() {

    const desktopReportBtn = document.querySelector('.btn-report--desktop');
    const mobileReportBtn = document.querySelector('.btn-report--mobile');
    
    // Function to transform a button
    function transformButton(button, isMobile = false) {
        if (!button) return;
        
        // Change button text and icon
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
                <path d="M17 8l4 4m0-4l-4 4"/>
            </svg>
            <span>Student</span>
        `;
        
        // Update button classes
        button.classList.add('student-btn');
        
        // Style adjustments
        button.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            background: linear-gradient(135deg, #2368AF 0%, #05AAA2 100%);
            border: none;
            padding: 9px 20px;
            border-radius: 24px;
            color: white;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        
        // Remove href if it's an anchor tag
        if (button.tagName === 'A') {
            button.removeAttribute('href');
        }
        
        // Add click event to open drawer
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.openDrawer();
        });
        
        // Hover effects
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.02)';
            button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = 'none';
        });
    }
    
    // Transform both buttons
    transformButton(desktopReportBtn, false);
    transformButton(mobileReportBtn, true);
}

// Create floating drawer button for mobile (fallback)
function initializeDrawerButton() {
    // Check if button already exists
    if (document.getElementById('floatingDrawerBtn')) return;
    
    const floatingBtn = document.createElement('button');
    floatingBtn.id = 'floatingDrawerBtn';
    floatingBtn.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
    `;
    floatingBtn.setAttribute('aria-label', 'Open menu');
    
    floatingBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 56px;
        height: 56px;
        border-radius: 28px;
        background: #1D9E75;
        color: white;
        border: none;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 999;
        transition: all 0.3s ease;
    `;
    
    floatingBtn.addEventListener('click', () => {
        window.openDrawer();
    });
    
    document.body.appendChild(floatingBtn);
    
    // Show/hide based on screen size (only if student button is hidden on mobile)
    function checkScreenSize() {
        const mobileBtn = document.querySelector('.btn-report--mobile');
        if (window.innerWidth <= 768 && (!mobileBtn || mobileBtn.style.display === 'none')) {
            floatingBtn.style.display = 'flex';
        } else {
            floatingBtn.style.display = 'none';
        }
    }
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
}

// Add drawer toggle button in topbar (desktop fallback)
function addDrawerToggleToTopbar() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return;
    
    // Check if toggle already exists
    if (document.getElementById('drawerToggleBtn')) return;
    
    const drawerToggle = document.createElement('button');
    drawerToggle.id = 'drawerToggleBtn';
    drawerToggle.setAttribute('aria-label', 'Toggle menu');
    drawerToggle.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
        <span>Menu</span>
    `;
    
    drawerToggle.style.cssText = `
        display: none;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: #F3F4F6;
        border: 1px solid #E4E1DB;
        border-radius: 24px;
        cursor: pointer;
        font-family: inherit;
        font-size: 13px;
        font-weight: 500;
        color: #374151;
        transition: all 0.2s ease;
        margin-right: 12px;
    `;
    
    drawerToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        window.openDrawer();
    });
    
    // Insert at the beginning of topbar-left
    const topbarLeft = topbar.querySelector('.topbar-left');
    if (topbarLeft) {
        topbarLeft.insertBefore(drawerToggle, topbarLeft.firstChild);
    }
}

// Add close button inside drawer
function addDrawerCloseButton() {
    const drawerHeader = document.querySelector('.drawer-header');
    if (!drawerHeader) return;
    
    // Check if close button already exists
    if (document.getElementById('drawerCloseBtn')) return;
    
    const closeBtn = document.createElement('button');
    closeBtn.id = 'drawerCloseBtn';
    closeBtn.setAttribute('aria-label', 'Close menu');
    closeBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
    `;
    
    closeBtn.style.cssText = `
        position: absolute;
        top: 16px;
        right: 16px;
        background: rgba(255,255,255,0.2);
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: white;
        transition: all 0.2s ease;
    `;
    
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.closeDrawer();
    });
    
    drawerHeader.appendChild(closeBtn);
}

// Add drawer styles
function addDrawerStyles() {
    if (document.getElementById('drawer-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'drawer-styles';
    style.textContent = `
        /* Student button styles */
        .student-btn {
            transition: all 0.2s ease !important;
        }
        
        .student-btn:hover {
            transform: scale(1.02) !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
        }
        
        .student-btn:active {
            transform: scale(0.98) !important;
        }
        
        /* Drawer improvements */
        .drawer {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 2px 0 10px rgba(0,0,0,0.1);
        }
        
        .drawer.open {
            transform: translateX(0);
        }
        
        .drawer-overlay {
            transition: opacity 0.3s ease;
        }
        
        /* Profile image styles */
        .avatar-circle {
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        
        .avatar-circle:hover {
            transform: scale(1.05);
        }
        
        .edit-avatar-hint {
            cursor: pointer;
            transition: opacity 0.2s ease;
        }
        
        .edit-avatar-hint:hover {
            opacity: 0.8;
        }
        
        /* Stats counter animation - FIXED */
        .stat-number {
            display: inline-block;
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .stat-animate {
            animation: statsPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55) !important;
        }
        
        @keyframes statsPop {
            0% { 
                transform: scale(1);
                color: #0F2B3D;
            }
            50% { 
                transform: scale(1.3);
                color: #1D9E75;
            }
            100% { 
                transform: scale(1);
                color: #0F2B3D;
            }
        }
        
        /* Mobile adjustments */
        @media (max-width: 768px) {
            .drawer {
                width: 280px;
            }
            
            .btn-report--desktop {
                display: none !important;
            }
            
            .btn-report--mobile {
                display: flex !important;
            }
        }
        
        /* Desktop adjustments */
        @media (min-width: 769px) {
            .btn-report--mobile {
                display: none !important;
            }
            
            .btn-report--desktop {
                display: flex !important;
            }
        }
        
        /* Drawer item hover effect */
        .drawer-item {
            transition: all 0.2s ease;
        }
        
        .drawer-item:hover {
            padding-left: 28px;
            background: rgba(255,255,255,0.1);
        }
        
        /* Active drawer item */
        .drawer-item.active {
            background: rgba(255,255,255,0.15);
            border-left-color: #1D9E75;
        }
        
        /* Drawer close button animation */
        #drawerCloseBtn {
            transition: all 0.3s ease;
        }
        
        #drawerCloseBtn:hover {
            transform: rotate(90deg);
            background: rgba(255,255,255,0.3);
        }
    `;
    document.head.appendChild(style);
}

function initializeDrawer() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('overlay');
    const hamburger = document.getElementById('hamburger');
    const studentName = document.getElementById('studentName');
    
    if (studentName) studentName.textContent = CURRENT_STUDENT.name;
    
    // Add drawer styles
    addDrawerStyles();
    
    // Add close button to drawer
    addDrawerCloseButton();
    
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
    if (overlay) overlay.addEventListener('click', window.closeDrawer);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') window.closeDrawer();
    });
    
    // Drawer navigation
    document.querySelectorAll('.drawer-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.drawer-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const page = item.getAttribute('data-page');
            if (page === 'myreports') {
                currentFilter = 'all';
                document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelector('.filter-btn[data-filter="all"]')?.classList.add('active');
                loadAndDisplayReports();
            }
            window.closeDrawer();
        });
    });
    
    // ========== LOGOUT BUTTON - FIXED ==========
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        // Remove any existing event listeners
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        
        newLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Show confirmation dialog
            const confirmLogout = confirm('Are you sure you want to logout?');
            
            if (confirmLogout) {
                // Clear student session from localStorage
                localStorage.removeItem('currentStudent');
                localStorage.removeItem('studentSession');
                
                // Show logout message
                alert('Logging out...');
                
                // Redirect to landing page
                window.location.href = '/Assets/Landing_page/land.html';
            }
        });
    }
}

function getReports() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    
    const emptyReports = [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyReports));
    return emptyReports;
}

function saveReports(reports) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

function getStudentReports() {
    const allReports = getReports();
    return allReports.filter(report => report.studentId === CURRENT_STUDENT.id);
}

function loadAndDisplayReports() {
    const allReports = getReports();
    let filteredReports = allReports;
    
    if (currentFilter !== 'all') {
        filteredReports = allReports.filter(report => report.category === currentFilter);
    }
    
    // Sort by timestamp (newest first)
    filteredReports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    displayIncidents(filteredReports);
    updateStats();
}

function displayIncidents(reports) {
    const container = document.getElementById('incidentsContainer');
    if (!container) return;
    
    if (reports.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <div class="empty-title">No reports yet</div>
                <div class="empty-sub">Click the "+ Report" button to submit your first incident report</div>
            </div>
        `;
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
    
    return `
        <div class="incident-card" data-category="${report.category}" data-id="${report.id}">
            <div class="inc-icon ic-${report.category === 'security' ? 'red' : report.category === 'maintenance' ? 'blue' : 'green'}">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${getCategoryIcon(report.category)}
                </svg>
            </div>
            <div class="inc-body">
                <div class="inc-title">${escapeHtml(report.title)}</div>
                <div class="inc-location">${escapeHtml(report.location)}</div>
                <div class="badge-row">
                    <span class="badge" style="background: ${cat.bg}; color: ${cat.color};">${cat.label}</span>
                    <span class="badge" style="background: ${pri.bg}; color: ${pri.color};">${pri.label}</span>
                    <span class="badge" style="background: ${stat.bg}; color: ${stat.color};">${stat.label}</span>
                </div>
                <div class="inc-meta">
                    <div class="inc-reporters">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
                        </svg>
                        Reported by you
                    </div>
                    <div class="inc-time">${timeAgo}</div>
                </div>
            </div>
        </div>
    `;
}

function getCategoryIcon(category) {
    const icons = {
        security: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
        maintenance: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
        janitorial: '<path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
        facilities: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>'
    };
    return icons[category] || icons.maintenance;
}

function updateStats() {
    // ONLY get student reports - this ensures you only track YOUR reports
    const studentReports = getStudentReports(); 
    
    const yourReportsCount = studentReports.length; // Total YOUR reports
    const inProgressCount = studentReports.filter(r => r.status === 'in-progress' || r.status === 'in_progress').length; // YOUR in-progress reports
    const resolvedCount = studentReports.filter(r => r.status === 'resolved').length; // YOUR resolved reports
    
    const yourEl = document.getElementById('yourReportsCount');
    const inProgressEl = document.getElementById('inProgressCount');
    const resolvedEl = document.getElementById('approvedCount');
    
    // Update with animation - FIXED
    if (yourEl) {
        const oldValue = yourEl.textContent;
        yourEl.textContent = yourReportsCount;
        if (oldValue != yourReportsCount) {
            animateStatElement(yourEl);
        }
    }
    if (inProgressEl) {
        const oldValue = inProgressEl.textContent;
        inProgressEl.textContent = inProgressCount;
        if (oldValue != inProgressCount) {
            animateStatElement(inProgressEl);
        }
    }
    if (resolvedEl) {
        const oldValue = resolvedEl.textContent;
        resolvedEl.textContent = resolvedCount;
        if (oldValue != resolvedCount) {
            animateStatElement(resolvedEl);
        }
    }
    
    // Console logging for debugging
    console.log('=== Stats Updated ===');
    console.log(`Student: ${CURRENT_STUDENT.name} (ID: ${CURRENT_STUDENT.id})`);
    console.log(`Total Your Reports: ${yourReportsCount}`);
    console.log(`In Progress Reports: ${inProgressCount}`);
    console.log(`Resolved Reports: ${resolvedCount}`);
    console.log('====================');
}

// Animation function for stats - FIXED
function animateStatElement(element) {
    if (!element) return;
    
    // Remove any existing animation class
    element.classList.remove('stat-animate');
    
    // Force reflow to restart animation
    void element.offsetWidth;
    
    // Add animation class
    element.classList.add('stat-animate');
    
    // Remove animation class after it completes
    setTimeout(() => {
        element.classList.remove('stat-animate');
    }, 300);
}

function setupEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            loadAndDisplayReports();
        });
    });
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

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
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
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Export functions
window.addNewReport = function(reportData) {
    const reports = getReports();
    const newReport = {
        id: Date.now(),
        ...reportData,
        studentId: CURRENT_STUDENT.id,
        studentName: CURRENT_STUDENT.name,
        status: 'pending',
        timestamp: new Date().toISOString()
    };
    reports.unshift(newReport);
    saveReports(reports);
    loadAndDisplayReports();
    showNotification('Report submitted successfully!');
    
    // Force animation on stats after adding new report
    setTimeout(() => {
        updateStats();
    }, 100);
    
    return newReport;
};

window.getReports = getReports;
window.saveReports = saveReports;