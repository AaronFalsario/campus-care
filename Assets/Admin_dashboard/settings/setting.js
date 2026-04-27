    let allIncidents = [];
    let currentFilter = 'all';
    let incidentChart = null;
    let currentIncidentId = null;

    function loadData() {
        const stored = localStorage.getItem('campus_care_reports');
        if (stored && stored !== '[]') {
            const reports = JSON.parse(stored);
            allIncidents = reports.map(r => ({
                id: r.id,
                name: r.title || r.name,
                location: r.location,
                category: r.category || 'maintenance',
                priority: r.priority || 'medium',
                status: r.status || 'pending',
                reporter: r.studentName || r.reporter || 'Student',
                student_id: r.studentIdNumber || r.student_id_number || 'N/A',
                description: r.description || 'No description provided',
                image_url: r.imageUrl || r.image_url || null,
                timestamp: new Date(r.timestamp)
            }));
        } else {
            allIncidents = [];
        }
        updateAll();
    }

    function updateAll() { updateStats(); updateChart(); updateTopCategories(); renderIncidents(); renderMobileCards(); }

    function updateStats() {
        const total = allIncidents.length;
        const active = allIncidents.filter(i => i.status !== 'resolved').length;
        const resolved = allIncidents.filter(i => i.status === 'resolved').length;
        const rate = total ? Math.round((resolved / total) * 100) : 0;
        document.getElementById('totalReports').textContent = total;
        document.getElementById('activeReports').textContent = active;
        document.getElementById('resolvedRate').textContent = rate + '%';
        document.getElementById('avgResolution').textContent = total ? '42h' : '—';
        const cats = { security:0, maintenance:0, janitorial:0, facilities:0 };
        allIncidents.forEach(i => { if(cats[i.category] !== undefined) cats[i.category]++; });
        document.getElementById('securityCount').textContent = cats.security;
        document.getElementById('maintenanceCount').textContent = cats.maintenance;
        document.getElementById('janitorialCount').textContent = cats.janitorial;
        document.getElementById('facilitiesCount').textContent = cats.facilities;
    }

    function updateTopCategories() {
        const cats = { security:0, maintenance:0, janitorial:0, facilities:0 };
        allIncidents.forEach(i => { if(cats[i.category] !== undefined) cats[i.category]++; });
        document.getElementById('topSecurity').textContent = cats.security;
        document.getElementById('topMaintenance').textContent = cats.maintenance;
        document.getElementById('topJanitorial').textContent = cats.janitorial;
        document.getElementById('topFacilities').textContent = cats.facilities;
    }

    function updateChart() {
        const months = [];
        const monthlyData = {};
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthName = date.toLocaleString('default', { month: 'short' });
            months.push(monthName);
            monthlyData[monthName] = 0;
        }
        allIncidents.forEach(inc => {
            const monthName = new Date(inc.timestamp).toLocaleString('default', { month: 'short' });
            if (monthlyData[monthName] !== undefined) monthlyData[monthName]++;
        });
        const chartData = months.map(m => monthlyData[m] || 0);
        const ctx = document.getElementById('incidentChart').getContext('2d');
        if (incidentChart) incidentChart.destroy();
        incidentChart = new Chart(ctx, {
            type: 'line',
            data: { labels: months, datasets: [{ label: 'Incidents', data: chartData, borderColor: '#1D9E75', backgroundColor: 'rgba(29,158,117,0.1)', borderWidth: 2, fill: true, tension: 0.3, pointBackgroundColor: '#1D9E75', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4 }] },
            options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#E4E1DB' }, ticks: { stepSize: 1 } }, x: { grid: { display: false } } } }
        });
    }

    function getFiltered() {
        let filtered = [...allIncidents];
        if (currentFilter !== 'all') filtered = filtered.filter(i => i.status === currentFilter);
        return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    function renderIncidents() {
        const tbody = document.getElementById('incidentsTableBody');
        const filtered = getFiltered();
        if (filtered.length === 0) { tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:60px;">📭 No incidents found</td></tr>`; return; }
        tbody.innerHTML = filtered.map(inc => `
            <tr data-id="${inc.id}">
                <td><div class="inc-cell"><div class="inc-icon-sm" style="background:${getCategoryColor(inc.category)}20;color:${getCategoryColor(inc.category)}">${getIcon(inc.category)}</div><div><strong>${escape(inc.name)}</strong><br><span style="font-size:11px;color:var(--muted)">${escape(inc.location)}</span></div></div></td>
                <td><span class="badge b-${inc.category}">${inc.category}</span></td>
                <td><span class="badge b-${inc.priority}">${inc.priority}</span></td>
                <td><span class="badge b-${inc.status === 'in-progress' ? 'inprogress' : inc.status}">${inc.status}</span></td>
                <td>${escape(inc.reporter)}</span></td>
                <td>${inc.student_id}</span></td>
                <td>${getTimeAgo(inc.timestamp)}</span></td>
                <td><div class="action-btns"><button class="action-btn" onclick="openModal(${inc.id})">👁️</button></div></td>
            </tr>
        `).join('');
    }

    function renderMobileCards() {
        const container = document.getElementById('mobileCards');
        const filtered = getFiltered();
        if (filtered.length === 0) { container.innerHTML = `<div style="text-align:center;padding:40px;">📭 No incidents found</div>`; return; }
        container.innerHTML = filtered.map(inc => `
            <div class="m-card"><div class="m-card-top"><div class="inc-icon-sm" style="background:${getCategoryColor(inc.category)}20;color:${getCategoryColor(inc.category)}">${getIcon(inc.category)}</div><div><strong>${escape(inc.name)}</strong><div style="font-size:11px;color:var(--muted)">${escape(inc.location)}</div></div></div>
            <div class="m-card-body"><div><div class="m-field-label">Category</div><span class="badge b-${inc.category}">${inc.category}</span></div><div><div class="m-field-label">Priority</div><span class="badge b-${inc.priority}">${inc.priority}</span></div><div><div class="m-field-label">Status</div><span class="badge b-${inc.status === 'in-progress' ? 'inprogress' : inc.status}">${inc.status}</span></div><div><div class="m-field-label">Reporter</div>${escape(inc.reporter)}</div></div>
            <div class="m-card-footer"><div class="m-timestamp">${getTimeAgo(inc.timestamp)}</div><div class="action-btns"><button class="action-btn" onclick="openModal(${inc.id})">👁️</button></div></div></div>
        `).join('');
    }

    window.openModal = function(id) {
        const inc = allIncidents.find(i => i.id === id);
        if (!inc) return;
        currentIncidentId = id;
        document.getElementById('modalTitle').innerText = inc.name;
        document.getElementById('modalLocation').innerText = inc.location;
        document.getElementById('modalCategory').innerHTML = `<span class="badge b-${inc.category}">${inc.category}</span>`;
        document.getElementById('modalPriority').innerHTML = `<span class="badge b-${inc.priority}">${inc.priority}</span>`;
        document.getElementById('modalReporter').innerText = inc.reporter;
        document.getElementById('modalStudentId').innerText = inc.student_id;
        document.getElementById('modalDate').innerText = new Date(inc.timestamp).toLocaleString();
        document.getElementById('modalDescription').innerText = inc.description || 'No description provided';
        document.getElementById('modalStatus').value = inc.status;
        
        const modalImage = document.getElementById('modalImage');
        const noImageDiv = document.getElementById('noImage');
        if (inc.image_url && inc.image_url !== 'null' && inc.image_url !== '') {
            modalImage.src = inc.image_url;
            modalImage.style.display = 'block';
            noImageDiv.style.display = 'none';
        } else {
            modalImage.style.display = 'none';
            noImageDiv.style.display = 'flex';
            noImageDiv.style.flexDirection = 'column';
            noImageDiv.style.alignItems = 'center';
        }
        document.getElementById('incidentModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    window.closeModal = function() {
        document.getElementById('incidentModal').classList.remove('active');
        document.body.style.overflow = '';
        currentIncidentId = null;
    };

    window.saveStatus = function() {
        if (!currentIncidentId) return;
        const newStatus = document.getElementById('modalStatus').value;
        const incident = allIncidents.find(i => i.id === currentIncidentId);
        if (incident && newStatus !== incident.status) {
            incident.status = newStatus;
            const stored = localStorage.getItem('campus_care_reports');
            if (stored) {
                const reports = JSON.parse(stored);
                const updatedReports = reports.map(r => { if (r.id === currentIncidentId) r.status = newStatus; return r; });
                localStorage.setItem('campus_care_reports', JSON.stringify(updatedReports));
            }
            updateAll();
            showNotification(`✓ Status updated to ${newStatus}`);
        }
        closeModal();
    };

    function getIcon(cat) { return { security:'⚠️', maintenance:'🔧', janitorial:'🧹', facilities:'🏢' }[cat] || '📋'; }
    function getCategoryColor(cat) { return { security:'#DC2626', maintenance:'#2563EB', janitorial:'#1D9E75', facilities:'#D97706' }[cat] || '#6B7280'; }
    function getTimeAgo(date) { const h = Math.floor((Date.now() - new Date(date)) / 3600000); if (h < 1) return 'Just now'; if (h < 24) return `${h}h ago`; return `${Math.floor(h/24)}d ago`; }
    function escape(t) { if (!t) return ''; return t.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m])); }
    function showNotification(msg) { const n = document.createElement('div'); n.className = 'notification'; n.textContent = msg; document.body.appendChild(n); setTimeout(() => n.remove(), 3000); }

    function setupEvents() {
        const drawer = document.getElementById('drawer');
        const overlay = document.getElementById('overlay');
        const hamburger = document.getElementById('hamburger');
        if (hamburger) hamburger.onclick = () => { drawer.classList.toggle('open'); overlay.classList.toggle('open'); };
        if (overlay) overlay.onclick = () => { drawer.classList.remove('open'); overlay.classList.remove('open'); };
        
        document.querySelectorAll('.filter-chip').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                renderIncidents(); renderMobileCards();
            };
        });
        
        document.querySelectorAll('.drawer-item').forEach(item => {
            item.onclick = () => {
                const page = item.dataset.page;
                if (page === 'incidents') window.location.href = '/Assets/Admin_dashboard/incident/incident.html';
                else if (page === 'users') window.location.href = '/Assets/Admin_dashboard/user_page/user.html';
                else if (page === 'settings') window.location.href = '/Assets/Admin_dashboard/Settings.html';
                else if (page !== 'dashboard') showNotification(`${page} page coming soon`);
                drawer.classList.remove('open'); overlay.classList.remove('open');
            };
        });
        
        document.getElementById('logoutBtn').onclick = () => { if (confirm('Logout?')) { localStorage.removeItem('currentStudent'); window.location.href = '/LANDING PAGE/land.html'; } };
        document.addEventListener('click', (e) => { if (window.innerWidth <= 768 && !drawer.contains(e.target) && !hamburger.contains(e.target)) { drawer.classList.remove('open'); overlay.classList.remove('open'); } });
    }

    loadData();
    setupEvents();
    window.addEventListener('storage', (e) => { if (e.key === 'campus_care_reports') { loadData(); showNotification('Data updated'); } });