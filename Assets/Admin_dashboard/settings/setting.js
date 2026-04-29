import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase Configuration
const supabaseUrl = 'https://opjyksksnccurdwyskiu.supabase.co'
const supabaseKey = 'sb_publishable_l7mKNQVJ6WesiTM4GJCxQg_oXxTN3it'
const supabase = createClient(supabaseUrl, supabaseKey)

let currentAdminData = null;

// ============ SETTINGS MANAGER - PERSISTENT STORAGE ============
class PersistentSettings {
    constructor() {
        this.settings = this.loadSettings();
    }

    // Load settings from localStorage (persists across logout/login)
    loadSettings() {
        const stored = localStorage.getItem('campus_care_admin_settings');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                return this.getDefaultSettings();
            }
        }
        return this.getDefaultSettings();
    }

    // Default settings
    getDefaultSettings() {
        return {
            // Profile Settings (saved to Supabase as well)
            adminName: '',
            
            // Notification Settings
            emailNotifications: true,
            pushNotifications: false,
            
            // Display Settings
            defaultView: 'overview',
            darkMode: false,
            compactMode: false,
            
            // Auto-refresh Settings
            autoRefresh: true,
            refreshInterval: 30,
            
            // Data Settings
            autoDeleteResolved: true,
            resolvedRetentionHours: 24,
            
            // Session Settings
            sessionTimeout: 60,
            
            // Last updated timestamp
            lastUpdated: new Date().toISOString()
        };
    }

    // Save all settings
    saveSettings() {
        this.settings.lastUpdated = new Date().toISOString();
        localStorage.setItem('campus_care_admin_settings', JSON.stringify(this.settings));
        
        // Also save to Supabase for cross-device sync
        this.syncToSupabase();
        
        // Apply settings to current page
        this.applySettingsToPage();
        
        return this.settings;
    }

    // Sync settings to Supabase database
    async syncToSupabase() {
        if (!currentAdminData || !currentAdminData.email) return;
        
        try {
            const { error } = await supabase
                .from('admin')
                .update({ 
                    settings: this.settings,
                    updated_at: new Date().toISOString()
                })
                .eq('email', currentAdminData.email);
            
            if (error) console.error('Error syncing settings to Supabase:', error);
        } catch (err) {
            console.error('Sync error:', err);
        }
    }

    // Load settings from Supabase (for cross-device sync)
    async loadFromSupabase() {
        if (!currentAdminData || !currentAdminData.email) return;
        
        try {
            const { data, error } = await supabase
                .from('admin')
                .select('settings')
                .eq('email', currentAdminData.email)
                .single();
            
            if (!error && data && data.settings) {
                this.settings = { ...this.settings, ...data.settings };
                localStorage.setItem('campus_care_admin_settings', JSON.stringify(this.settings));
                this.applySettingsToPage();
                this.updateAllUI();
            }
        } catch (err) {
            console.error('Error loading settings from Supabase:', err);
        }
    }

    // Get a specific setting
    get(key) {
        return this.settings[key];
    }

    // Update a specific setting
    set(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        this.updateUIElement(key, value);
        return this;
    }

    // Update multiple settings
    update(updates) {
        Object.assign(this.settings, updates);
        this.saveSettings();
        this.updateAllUI();
        return this;
    }

    // Apply all settings to current page
    applySettingsToPage() {
        this.applyDarkMode(this.settings.darkMode);
        this.applyCompactMode(this.settings.compactMode);
        this.setupAutoRefresh(this.settings.autoRefresh);
        this.applyNotificationSettings();
    }

    // Apply dark mode
    applyDarkMode(enabled) {
        if (enabled) {
            document.body.classList.add('dark-mode');
            document.documentElement.style.setProperty('--bg', '#1a1a2e');
            document.documentElement.style.setProperty('--surface', '#16213e');
            document.documentElement.style.setProperty('--text', '#eeeeee');
            document.documentElement.style.setProperty('--border', '#2a2a4a');
        } else {
            document.body.classList.remove('dark-mode');
            document.documentElement.style.setProperty('--bg', '#F4F3EF');
            document.documentElement.style.setProperty('--surface', '#FFFFFF');
            document.documentElement.style.setProperty('--text', '#161513');
            document.documentElement.style.setProperty('--border', '#E4E1DB');
        }
    }

    // Apply compact mode
    applyCompactMode(enabled) {
        if (enabled) {
            document.body.classList.add('compact-mode');
            let style = document.getElementById('compact-mode-styles');
            if (!style) {
                style = document.createElement('style');
                style.id = 'compact-mode-styles';
                style.textContent = `
                    .compact-mode main { padding: 16px 20px !important; }
                    .compact-mode .stat-card { padding: 10px 14px !important; }
                    .compact-mode .page-header { padding: 16px 20px !important; margin-bottom: 20px !important; }
                    .compact-mode .settings-panel { padding: 20px 24px !important; }
                    .compact-mode table td, .compact-mode table th { padding: 8px 12px !important; }
                    .compact-mode .form-group input { padding: 8px 12px !important; }
                `;
                document.head.appendChild(style);
            }
        } else {
            document.body.classList.remove('compact-mode');
            const style = document.getElementById('compact-mode-styles');
            if (style) style.remove();
        }
    }

    // Setup auto-refresh
    setupAutoRefresh(enabled) {
        if (window.autoRefreshInterval) {
            clearInterval(window.autoRefreshInterval);
            window.autoRefreshInterval = null;
        }
        
        if (enabled && this.settings.refreshInterval) {
            window.autoRefreshInterval = setInterval(() => {
                if (typeof loadStats === 'function') loadStats();
                if (typeof loadData === 'function') loadData();
                if (typeof loadIncidents === 'function') loadIncidents();
                this.showToast('Data auto-refreshed', 'info');
            }, this.settings.refreshInterval * 1000);
        }
    }

    // Apply notification settings
    applyNotificationSettings() {
        if (this.settings.pushNotifications && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    }

    // Update UI element based on setting
    updateUIElement(key, value) {
        const element = document.getElementById(`setting_${key}`);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = value;
            } else if (element.tagName === 'SELECT') {
                element.value = value;
            } else {
                element.value = value;
            }
        }
    }

    // Update all UI elements
    updateAllUI() {
        const uiMappings = {
            emailNotifications: 'checkbox',
            pushNotifications: 'checkbox',
            defaultView: 'select',
            darkMode: 'checkbox',
            compactMode: 'checkbox',
            autoRefresh: 'checkbox',
            refreshInterval: 'number',
            autoDeleteResolved: 'checkbox',
            resolvedRetentionHours: 'number',
            sessionTimeout: 'number'
        };
        
        for (const [key, type] of Object.entries(uiMappings)) {
            this.updateUIElement(key, this.settings[key]);
        }
        
        // Update display values
        const refreshValue = document.getElementById('refreshValue');
        if (refreshValue) refreshValue.textContent = `${this.settings.refreshInterval}s`;
        
        const retentionValue = document.getElementById('retentionValue');
        if (retentionValue) retentionValue.textContent = `${this.settings.resolvedRetentionHours}h`;
    }

    // Reset to default settings
    resetToDefault() {
        if (confirm('⚠️ Reset all settings to default? This cannot be undone.')) {
            this.settings = this.getDefaultSettings();
            this.saveSettings();
            this.updateAllUI();
            this.applySettingsToPage();
            this.showToast('Settings reset to default!', 'success');
        }
    }

    // Export settings
    exportSettings() {
        const data = JSON.stringify(this.settings, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `campus_care_settings_${new Date().toISOString().slice(0, 19)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Settings exported!', 'success');
    }

    // Import settings
    importSettings(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                this.settings = { ...this.settings, ...imported };
                this.saveSettings();
                this.updateAllUI();
                this.applySettingsToPage();
                this.showToast('Settings imported successfully!', 'success');
            } catch (err) {
                this.showToast('Invalid settings file', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Show toast notification
    showToast(message, type = 'success') {
        const existing = document.querySelector('.settings-toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = 'settings-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 40px;
            font-size: 13px;
            font-weight: 500;
            z-index: 10000;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease;
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Create global settings instance
window.persistentSettings = new PersistentSettings();

// ============ HELPER FUNCTIONS ============
function showMessage(message, type) {
    window.persistentSettings.showToast(message, type);
}

// ============ LOAD ADMIN DATA ============
async function loadAdminData() {
    try {
        const stored = localStorage.getItem('currentAdmin');
        if (!stored) {
            window.location.href = '/Assets/login/admin/admin.html';
            return;
        }
        
        currentAdminData = JSON.parse(stored);
        
        // Try to get latest from Supabase
        const { data, error } = await supabase
            .from('admin')
            .select('*')
            .eq('email', currentAdminData.email)
            .single();
        
        if (!error && data) {
            currentAdminData = data;
            localStorage.setItem('currentAdmin', JSON.stringify(data));
            
            // Load settings from Supabase if available
            if (data.settings) {
                window.persistentSettings.settings = { ...window.persistentSettings.settings, ...data.settings };
                localStorage.setItem('campus_care_admin_settings', JSON.stringify(window.persistentSettings.settings));
            }
        }
        
        // Load saved settings
        window.persistentSettings.loadFromSupabase();
        
        // Update UI
        const adminName = currentAdminData.name || currentAdminData.email;
        const initials = adminName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        
        const nameInput = document.getElementById('adminFullName');
        const emailInput = document.getElementById('adminEmail');
        const roleInput = document.getElementById('adminRole');
        const drawerName = document.getElementById('drawerAdminName');
        const topName = document.getElementById('topAdminName');
        const drawerInitials = document.getElementById('drawerInitials');
        
        if (nameInput) nameInput.value = adminName;
        if (emailInput) emailInput.value = currentAdminData.email || '';
        if (roleInput) roleInput.value = currentAdminData.role || 'Administrator';
        if (drawerName) drawerName.textContent = adminName;
        if (topName) topName.textContent = adminName.split(' ')[0] || 'Admin';
        if (drawerInitials) drawerInitials.textContent = initials;
        
        // Apply saved settings to page
        window.persistentSettings.applySettingsToPage();
        window.persistentSettings.updateAllUI();
        
        // Update preference form with saved values
        updatePreferenceForm();
        
    } catch (err) {
        console.error('Load admin error:', err);
    }
}

// ============ UPDATE PREFERENCE FORM ============
function updatePreferenceForm() {
    const defaultView = document.getElementById('defaultView');
    if (defaultView) defaultView.value = window.persistentSettings.get('defaultView');
    
    const darkMode = document.getElementById('darkMode');
    if (darkMode) darkMode.checked = window.persistentSettings.get('darkMode');
    
    const compactMode = document.getElementById('compactMode');
    if (compactMode) compactMode.checked = window.persistentSettings.get('compactMode');
    
    const autoRefresh = document.getElementById('autoRefresh');
    if (autoRefresh) autoRefresh.checked = window.persistentSettings.get('autoRefresh');
    
    const refreshInterval = document.getElementById('refreshInterval');
    if (refreshInterval) refreshInterval.value = window.persistentSettings.get('refreshInterval');
    
    const refreshValue = document.getElementById('refreshValue');
    if (refreshValue) refreshValue.textContent = `${window.persistentSettings.get('refreshInterval')}s`;
}

// ============ SAVE PROFILE ============
async function saveProfile() {
    const newName = document.getElementById('adminFullName').value.trim();
    if (!newName) {
        showMessage('Please enter a name', 'error');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('admin')
            .update({ name: newName })
            .eq('email', currentAdminData.email);
        
        if (error) throw error;
        
        currentAdminData.name = newName;
        localStorage.setItem('currentAdmin', JSON.stringify(currentAdminData));
        
        const initials = newName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const drawerName = document.getElementById('drawerAdminName');
        const topName = document.getElementById('topAdminName');
        const drawerInitials = document.getElementById('drawerInitials');
        
        if (drawerName) drawerName.textContent = newName;
        if (topName) topName.textContent = newName.split(' ')[0];
        if (drawerInitials) drawerInitials.textContent = initials;
        
        showMessage('Profile updated!', 'success');
    } catch (err) {
        showMessage('Error: ' + err.message, 'error');
    }
}

// ============ CHANGE PASSWORD ============
async function changePassword() {
    const currentPwd = document.getElementById('currentPassword').value;
    const newPwd = document.getElementById('newPassword').value;
    const confirmPwd = document.getElementById('confirmPassword').value;
    
    if (!currentPwd || !newPwd || !confirmPwd) {
        showMessage('Please fill all fields', 'error');
        return;
    }
    if (newPwd.length < 6) {
        showMessage('Password must be 6+ characters', 'error');
        return;
    }
    if (newPwd !== confirmPwd) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: currentAdminData.email,
            password: currentPwd
        });
        if (signInError) {
            showMessage('Current password is incorrect', 'error');
            return;
        }
        
        const { error } = await supabase.auth.updateUser({ password: newPwd });
        if (error) throw error;
        
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        
        showMessage('Password changed!', 'success');
    } catch (err) {
        showMessage('Error: ' + err.message, 'error');
    }
}

// ============ SAVE ALL PREFERENCES ============
function saveAllPreferences() {
    // Get values from UI
    const defaultView = document.getElementById('defaultView')?.value || 'overview';
    const darkMode = document.getElementById('darkMode')?.checked || false;
    const compactMode = document.getElementById('compactMode')?.checked || false;
    const autoRefresh = document.getElementById('autoRefresh')?.checked || true;
    const refreshInterval = parseInt(document.getElementById('refreshInterval')?.value || 30);
    
    // Update settings
    window.persistentSettings.update({
        defaultView: defaultView,
        darkMode: darkMode,
        compactMode: compactMode,
        autoRefresh: autoRefresh,
        refreshInterval: refreshInterval,
        lastUpdated: new Date().toISOString()
    });
    
    showMessage('All preferences saved! They will persist after logout.', 'success');
}

// ============ SAVE NOTIFICATION SETTINGS ============
function saveNotificationSettings() {
    const emailNotifications = document.getElementById('emailNotifications')?.checked || false;
    const pushNotifications = document.getElementById('pushNotifications')?.checked || false;
    
    window.persistentSettings.update({
        emailNotifications: emailNotifications,
        pushNotifications: pushNotifications
    });
    
    showMessage('Notification settings saved!', 'success');
}

// ============ SAVE DATA SETTINGS ============
function saveDataSettings() {
    const autoDeleteResolved = document.getElementById('autoDeleteResolved')?.checked || true;
    const resolvedRetentionHours = parseInt(document.getElementById('resolvedRetentionHours')?.value || 24);
    
    window.persistentSettings.update({
        autoDeleteResolved: autoDeleteResolved,
        resolvedRetentionHours: resolvedRetentionHours
    });
    
    showMessage('Data settings saved!', 'success');
}

// ============ LOAD STATS ============
async function loadStats() {
    try {
        const { count: incidentsCount } = await supabase.from('reports').select('*', { count: 'exact', head: true });
        const { count: studentsCount } = await supabase.from('student').select('*', { count: 'exact', head: true });
        
        const totalIncidents = document.getElementById('statTotalIncidents');
        const totalStudents = document.getElementById('statTotalStudents');
        const supabaseStatus = document.getElementById('supabaseStatus');
        const localStorageStatus = document.getElementById('localStorageStatus');
        const storageUsed = document.getElementById('storageUsed');
        
        if (totalIncidents) totalIncidents.textContent = incidentsCount || 0;
        if (totalStudents) totalStudents.textContent = studentsCount || 0;
        if (supabaseStatus) supabaseStatus.innerHTML = '<span style="color:#10b981;">✅ Connected</span>';
        if (localStorageStatus) localStorageStatus.innerHTML = '<span style="color:#10b981;">✅ Available</span>';
        
        let totalSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            totalSize += (key.length + (value ? value.length : 0)) * 2;
        }
        if (storageUsed) storageUsed.textContent = (totalSize / 1024).toFixed(1) + ' KB';
    } catch (err) {
        const supabaseStatus = document.getElementById('supabaseStatus');
        if (supabaseStatus) supabaseStatus.innerHTML = '<span style="color:#ef4444;">❌ Disconnected</span>';
    }
}

// ============ EXPORT DATA ============
async function exportIncidents() {
    const { data } = await supabase.from('reports').select('*');
    if (!data || data.length === 0) {
        showMessage('No incidents to export', 'error');
        return;
    }
    let csv = 'ID,Title,Location,Category,Priority,Status,Date\n';
    data.forEach(item => {
        csv += `"${item.id}","${(item.title || '').replace(/"/g, '""')}","${(item.location || '').replace(/"/g, '""')}","${item.category || ''}","${item.priority || ''}","${item.status || ''}","${item.created_at || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `incidents_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showMessage(`Exported ${data.length} incidents`, 'success');
}

async function exportStudents() {
    const { data } = await supabase.from('student').select('*');
    if (!data || data.length === 0) {
        showMessage('No students to export', 'error');
        return;
    }
    let csv = 'ID,Full Name,Student ID,Email,Created At\n';
    data.forEach(item => {
        csv += `"${item.id}","${(item.full_name || '').replace(/"/g, '""')}","${item.student_id || ''}","${item.email || ''}","${item.created_at || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `students_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    showMessage(`Exported ${data.length} students`, 'success');
}

// ============ CLEAR INCIDENTS ============
async function clearIncidents() {
    if (!confirm('⚠️ Delete ALL incidents? This cannot be undone!')) return;
    await supabase.from('reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    localStorage.setItem('campus_care_reports', '[]');
    showMessage('All incidents cleared', 'success');
    loadStats();
}

// ============ MODAL ============
let pendingClear = null;

function showConfirmModal(message, callback) {
    const modal = document.getElementById('confirmationModal');
    const modalMessage = document.getElementById('modalMessage');
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const cancelBtn = document.getElementById('modalCancelBtn');
    
    if (!modal) return;
    
    modalMessage.textContent = message;
    pendingClear = callback;
    modal.classList.add('active');
    
    const handleConfirm = () => {
        if (pendingClear) pendingClear();
        closeModal();
        cleanup();
    };
    const handleCancel = () => {
        closeModal();
        cleanup();
    };
    const cleanup = () => {
        if (confirmBtn) confirmBtn.removeEventListener('click', handleConfirm);
        if (cancelBtn) cancelBtn.removeEventListener('click', handleCancel);
    };
    if (confirmBtn) confirmBtn.addEventListener('click', handleConfirm);
    if (cancelBtn) cancelBtn.addEventListener('click', handleCancel);
}

function closeModal() {
    const modal = document.getElementById('confirmationModal');
    if (modal) modal.classList.remove('active');
}

// ============ TABS ============
function setupTabs() {
    const tabs = document.querySelectorAll('.settings-sidebar-item');
    const contents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            contents.forEach(c => c.style.display = 'none');
            const activeTab = document.getElementById(`tab-${this.dataset.tab}`);
            if (activeTab) activeTab.style.display = 'block';
        });
    });
}

// ============ NAVIGATION ============
function setupNavigation() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('overlay');
    const hamburger = document.getElementById('hamburger');
    const adminPill = document.getElementById('adminPill');
    
    if (hamburger) hamburger.onclick = () => { drawer.classList.toggle('open'); if (overlay) overlay.classList.toggle('open'); };
    if (adminPill) adminPill.onclick = () => { drawer.classList.toggle('open'); if (overlay) overlay.classList.toggle('open'); };
    if (overlay) overlay.onclick = () => { drawer.classList.remove('open'); overlay.classList.remove('open'); };
    
    document.querySelectorAll('.drawer-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            if (page === 'dashboard') window.location.href = '/Assets/Admin_dashboard/Admin.html';
            else if (page === 'incidents') window.location.href = '/Assets/Admin_dashboard/incident/incident.html';
            else if (page === 'users') window.location.href = '/Assets/Admin_dashboard/user_page/user.html';
            drawer.classList.remove('open');
            if (overlay) overlay.classList.remove('open');
        });
    });
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            if (confirm('Logout?')) {
                await supabase.auth.signOut();
                localStorage.removeItem('currentAdmin');
                localStorage.removeItem('isAdminLoggedIn');
                // Settings stay in localStorage - they will load when admin logs back in
                window.location.href = '/Assets/Landing_page/land.html';
            }
        };
    }
    
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && drawer && hamburger && !drawer.contains(e.target) && !hamburger.contains(e.target)) {
            drawer.classList.remove('open');
            if (overlay) overlay.classList.remove('open');
        }
    });
}

// ============ SETUP BUTTONS ============
function setupButtons() {
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const savePreferencesBtn = document.getElementById('savePreferencesBtn');
    const exportIncidentsBtn = document.getElementById('exportIncidentsBtn');
    const exportStudentsBtn = document.getElementById('exportStudentsBtn');
    const clearDataBtn = document.getElementById('clearDataBtn');
    const resetSettingsBtn = document.getElementById('resetSettingsBtn');
    const exportSettingsBtn = document.getElementById('exportSettingsBtn');
    const importSettingsInput = document.getElementById('importSettingsInput');
    
    if (saveProfileBtn) saveProfileBtn.onclick = saveProfile;
    if (changePasswordBtn) changePasswordBtn.onclick = changePassword;
    if (savePreferencesBtn) savePreferencesBtn.onclick = saveAllPreferences;
    if (exportIncidentsBtn) exportIncidentsBtn.onclick = exportIncidents;
    if (exportStudentsBtn) exportStudentsBtn.onclick = exportStudents;
    if (clearDataBtn) clearDataBtn.onclick = () => showConfirmModal('⚠️ Clear ALL incidents? This cannot be undone.', clearIncidents);
    
    if (resetSettingsBtn) {
        resetSettingsBtn.onclick = () => {
            if (confirm('⚠️ Reset all settings to default? This will clear your preferences.')) {
                window.persistentSettings.resetToDefault();
                updatePreferenceForm();
            }
        };
    }
    
    if (exportSettingsBtn) {
        exportSettingsBtn.onclick = () => window.persistentSettings.exportSettings();
    }
    
    if (importSettingsInput) {
        const importBtn = document.getElementById('importSettingsBtn');
        if (importBtn) {
            importBtn.onclick = () => importSettingsInput.click();
        }
        importSettingsInput.onchange = (e) => {
            if (e.target.files.length) {
                window.persistentSettings.importSettings(e.target.files[0]);
                updatePreferenceForm();
                importSettingsInput.value = '';
            }
        };
    }
}

// ============ SETUP RANGE SLIDER DISPLAY ============
function setupRangeSliders() {
    const refreshSlider = document.getElementById('refreshInterval');
    const refreshValue = document.getElementById('refreshValue');
    const retentionSlider = document.getElementById('resolvedRetentionHours');
    const retentionValue = document.getElementById('retentionValue');
    
    if (refreshSlider && refreshValue) {
        refreshSlider.oninput = () => {
            refreshValue.textContent = `${refreshSlider.value}s`;
        };
    }
    
    if (retentionSlider && retentionValue) {
        retentionSlider.oninput = () => {
            retentionValue.textContent = `${retentionSlider.value}h`;
        };
    }
}

// ============ INITIALIZE ============
async function init() {
    await loadAdminData();
    await loadStats();
    setupTabs();
    setupNavigation();
    setupButtons();
    setupRangeSliders();
}

init();