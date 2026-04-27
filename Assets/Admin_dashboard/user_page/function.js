        // ========== CLEAN STUDENT MANAGEMENT SYSTEM ==========
        let students = [];
        let editingStudentId = null;

        // Load students from localStorage
        function loadStudents() {
            const stored = localStorage.getItem('campus_care_students');
            if (stored) {
                students = JSON.parse(stored);
            } else {
                students = [
                    { id: 1, name: "Juan Dela Cruz", idNumber: "2024-00123", course: "BSCS", year: "3", email: "juan.delacruz@campus.edu", status: "active", reports: 5 },
                    { id: 2, name: "Maria Santos", idNumber: "2024-00124", course: "BSIT", year: "2", email: "maria.santos@campus.edu", status: "active", reports: 3 },
                    { id: 3, name: "Jose Rizal", idNumber: "2024-00125", course: "BSECE", year: "4", email: "jose.rizal@campus.edu", status: "inactive", reports: 1 }
                ];
                saveStudents();
            }
            renderStudents();
            updateStats();
        }

        function saveStudents() {
            localStorage.setItem('campus_care_students', JSON.stringify(students));
        }

        function renderStudents() {
            const tbody = document.getElementById('studentsTableBody');
            if (students.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><div class="empty-icon">👨‍🎓</div><div class="empty-title">No students yet</div><div>Click "Add Student" to get started</div></td></tr>`;
                return;
            }
            tbody.innerHTML = students.map(student => `
                <tr data-id="${student.id}">
                    <td><div class="student-info"><div class="student-avatar">${getInitials(student.name)}</div><div><div class="student-name">${escapeHtml(student.name)}</div><div class="student-detail">${escapeHtml(student.email)}</div></div></div></td>
                    <td><strong>${escapeHtml(student.idNumber)}</strong></td>
                    <td>${escapeHtml(student.course)} - ${student.year}${getYearSuffix(student.year)} Year</td>
                    <td><span class="badge-active">${student.reports || 0} reports</span></td>
                    <td><span class="${student.status === 'active' ? 'badge-active' : 'badge-inactive'}">${student.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                    <td><div class="action-btns"><button class="action-btn edit-student" data-id="${student.id}" title="Edit Student"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="action-btn del delete-student" data-id="${student.id}" title="Delete Student"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button></div></td>
                </tr>
            `).join('');
            
            document.querySelectorAll('.edit-student').forEach(btn => btn.addEventListener('click', () => editStudent(parseInt(btn.dataset.id))));
            document.querySelectorAll('.delete-student').forEach(btn => btn.addEventListener('click', () => deleteStudent(parseInt(btn.dataset.id))));
        }

        function getInitials(name) { return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); }
        function getYearSuffix(year) { return { 1: 'st', 2: 'nd', 3: 'rd', 4: 'th' }[year] || 'th'; }

        function updateStats() {
            const total = students.length;
            const active = students.filter(s => s.status === 'active').length;
            const totalReports = students.reduce((sum, s) => sum + (s.reports || 0), 0);
            const avgReports = total > 0 ? (totalReports / total).toFixed(1) : 0;
            document.getElementById('totalStudents').textContent = total;
            document.getElementById('activeStudents').textContent = active;
            document.getElementById('totalReports').textContent = totalReports;
            document.getElementById('avgReports').textContent = avgReports;
        }

        function showNotification(message, type = 'info') {
            const n = document.createElement('div');
            n.className = 'notification';
            n.textContent = message;
            n.style.backgroundColor = type === 'success' ? '#10B981' : type === 'error' ? '#DC2626' : '#1E3A5F';
            document.body.appendChild(n);
            setTimeout(() => n.remove(), 3000);
        }

        function openModal() { document.getElementById('studentModal').classList.add('active'); document.body.style.overflow = 'hidden'; }
        function closeModal() {
            document.getElementById('studentModal').classList.remove('active');
            document.getElementById('studentForm').reset();
            document.getElementById('studentId').value = '';
            editingStudentId = null;
            document.getElementById('modalTitle').textContent = 'Add New Student';
            document.body.style.overflow = '';
        }

        function editStudent(id) {
            const student = students.find(s => s.id === id);
            if (!student) return;
            editingStudentId = id;
            document.getElementById('studentId').value = student.id;
            document.getElementById('studentFullName').value = student.name;
            document.getElementById('studentIdNumber').value = student.idNumber;
            document.getElementById('studentCourse').value = student.course;
            document.getElementById('studentYear').value = student.year;
            document.getElementById('studentEmail').value = student.email;
            document.getElementById('studentStatus').value = student.status;
            document.getElementById('modalTitle').textContent = 'Edit Student';
            openModal();
        }

        function deleteStudent(id) {
            const student = students.find(s => s.id === id);
            if (!student) return;
            if (confirm(`Are you sure you want to delete "${student.name}"?`)) {
                students = students.filter(s => s.id !== id);
                saveStudents();
                renderStudents();
                updateStats();
                showNotification(`✓ ${student.name} has been deleted`, 'success');
            }
        }

        document.getElementById('studentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const studentData = {
                name: document.getElementById('studentFullName').value.trim(),
                idNumber: document.getElementById('studentIdNumber').value.trim(),
                course: document.getElementById('studentCourse').value,
                year: document.getElementById('studentYear').value,
                email: document.getElementById('studentEmail').value.trim(),
                status: document.getElementById('studentStatus').value,
                reports: 0
            };
            if (!studentData.name || !studentData.idNumber || !studentData.course || !studentData.year || !studentData.email) {
                showNotification('Please fill in all fields', 'error');
                return;
            }
            const existingId = document.getElementById('studentId').value;
            if (existingId) {
                const index = students.findIndex(s => s.id === parseInt(existingId));
                if (index !== -1) {
                    students[index] = { ...students[index], ...studentData };
                    showNotification(`✓ ${studentData.name} has been updated`, 'success');
                }
            } else {
                const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
                students.push({ ...studentData, id: newId });
                showNotification(`✓ ${studentData.name} has been added`, 'success');
            }
            saveStudents();
            renderStudents();
            updateStats();
            closeModal();
        });

        function setupNavigation() {
            document.querySelectorAll('.drawer-item').forEach(item => {
                item.addEventListener('click', function() {
                    const page = this.dataset.page;
                    if (page === 'dashboard') window.location.href = '/Assets/Admin_dashboard/Admin.html';
                    else if (page === 'incidents') window.location.href = '/Assets/Admin_dashboard/incident/incident.html';
                    else if (page === 'users') { /* already here */ }
                    else showNotification(`${page} page coming soon`, 'info');
                });
            });
        }

        function setupUI() {
            const drawer = document.getElementById('drawer');
            const overlay = document.getElementById('overlay');
            const hamburger = document.getElementById('hamburger');
            const adminPill = document.getElementById('adminPill');
            if (hamburger) hamburger.onclick = () => { drawer.classList.toggle('open'); overlay.classList.toggle('open'); };
            if (overlay) overlay.onclick = () => { drawer.classList.remove('open'); overlay.classList.remove('open'); };
            if (adminPill) adminPill.onclick = () => { drawer.classList.toggle('open'); overlay.classList.toggle('open'); };
            
            document.getElementById('addStudentBtn').addEventListener('click', openModal);
            document.getElementById('closeModalBtn').addEventListener('click', closeModal);
            document.getElementById('studentModal').addEventListener('click', (e) => { if (e.target === document.getElementById('studentModal')) closeModal(); });
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.getElementById('studentModal').classList.contains('active')) closeModal(); });
            
            document.getElementById('logoutBtn')?.addEventListener('click', () => {
                if (confirm('Logout?')) { showNotification('Logged out', 'success'); setTimeout(() => window.location.href = '/LANDING PAGE/land.html', 1000); }
            });
        }

        function escapeHtml(text) { if (!text) return ''; const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

        loadStudents();
        setupNavigation();
        setupUI();