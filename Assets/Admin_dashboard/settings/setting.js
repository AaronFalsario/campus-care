// Debug: Check if env vars are loading
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

let currentAdminData = null;

// ========== NOTIFICATION SYSTEM ==========
let notifications = [];
let notificationIdCounter = 0;
let isNotificationDropdownOpen = false;

function loadNotifications() {
    const stored = localStorage.getItem('settings_notifications');
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
    localStorage.setItem('settings_notifications', JSON.stringify(notifications));
    updateNotificationBadge();
}

function addInternalNotification(title, message, isUrgent = false) {
    // Skip unwanted notifications
    if (title === 'Auto Refresh' || title === 'Data Refreshed' || message.includes('refreshed')) return;
    if (title === 'Theme Changed') return;
    if (title === 'Welcome') return;
    
    const importantTitles = ['Profile Updated', 'Password Changed', 'Preferences Saved', 'Notification Settings', 'Data Settings Saved', 'Data Exported', 'Data Cleared', 'Settings Reset', 'Settings Imported'];
    if (!importantTitles.includes(title) && !isUrgent) return;
    
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
                <button class="clear-all-dropdown" onclick="window.clearAllNotifications()">Clear all</button>
            </div>
            <div class="notification-dropdown-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <p>No notifications yet</p>
                <p style="font-size: 11px; margin-top: 4px;">Important updates will appear here</p>
            </div>
        `;
        return;
    }
    
    const unreadCount = notifications.filter(n => !n.read).length;
    dropdown.innerHTML = `
        <div class="notification-dropdown-header">
            <span>🔔 Notifications ${unreadCount > 0 ? `(${unreadCount})` : ''}</span>
            <button class="clear-all-dropdown" onclick="window.clearAllNotifications()">Clear all</button>
        </div>
        <div class="notification-dropdown-list">
            ${notifications.slice(0, 15).map(notif => `
                <div class="notification-dropdown-item ${!notif.read ? 'unread' : ''} ${notif.isUrgent ? 'urgent' : ''}" onclick="window.markNotificationRead(${notif.id})">
                    <div class="notification-dropdown-title">${notif.isUrgent ? '🚨 ' : '📋 '}${escapeHtml(notif.title)}</div>
                    <div class="notification-dropdown-message">${escapeHtml(notif.message)}</div>
                    <div class="notification-dropdown-time">${getTimeAgo(new Date(notif.timestamp))}</div>
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
        const bell = document.getElementById('notificationBell');
        if (bell) {
            const rect = bell.getBoundingClientRect();
            dropdown.style.top = `${rect.bottom + 8}px`;
            dropdown.style.right = `${window.innerWidth - rect.right}px`;
        }
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
    showMessage('All notifications cleared', 'success');
};

function getTimeAgo(dateString) {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const h = Math.floor((Date.now() - date) / 3600000);
    if (h < 1) return 'Just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function showMessage(message, type = 'success') {
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

// ============ DARK MODE SYSTEM ==========
function initDarkMode() {
    const savedMode = localStorage.getItem('admin_dark_mode');
    const toggle = document.getElementById('darkModeToggle');
    const mobileDarkToggle = document.getElementById('mobileDarkModeToggle');
    
    if (savedMode === 'enabled') {
        document.body.classList.add('dark-mode');
        if (toggle) {
            const sunIcon = toggle.querySelector('.sun-icon');
            const moonIcon = toggle.querySelector('.moon-icon');
            if (sunIcon) sunIcon.style.display = 'none';
            if (moonIcon) moonIcon.style.display = 'block';
        }
        if (mobileDarkToggle) mobileDarkToggle.checked = true;
        if (window.persistentSettings) window.persistentSettings.settings.darkMode = true;
    } else if (savedMode === 'disabled') {
        document.body.classList.remove('dark-mode');
        if (toggle) {
            const sunIcon = toggle.querySelector('.sun-icon');
            const moonIcon = toggle.querySelector('.moon-icon');
            if (sunIcon) sunIcon.style.display = 'block';
            if (moonIcon) moonIcon.style.display = 'none';
        }
        if (mobileDarkToggle) mobileDarkToggle.checked = false;
        if (window.persistentSettings) window.persistentSettings.settings.darkMode = false;
    } else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('admin_dark_mode', 'enabled');
            if (toggle) {
                const sunIcon = toggle.querySelector('.sun-icon');
                const moonIcon = toggle.querySelector('.moon-icon');
                if (sunIcon) sunIcon.style.display = 'none';
                if (moonIcon) moonIcon.style.display = 'block';
            }
            if (mobileDarkToggle) mobileDarkToggle.checked = true;
            if (window.persistentSettings) window.persistentSettings.settings.darkMode = true;
        }
    }
    
    // Sync dark mode across all toggles
    function syncDarkMode(enabled) {
        document.body.classList.toggle('dark-mode', enabled);
        localStorage.setItem('admin_dark_mode', enabled ? 'enabled' : 'disabled');
        
        if (toggle) {
            const sunIcon = toggle.querySelector('.sun-icon');
            const moonIcon = toggle.querySelector('.moon-icon');
            if (sunIcon && moonIcon) {
                if (enabled) {
                    sunIcon.style.display = 'none';
                    moonIcon.style.display = 'block';
                } else {
                    sunIcon.style.display = 'block';
                    moonIcon.style.display = 'none';
                }
            }
        }
        if (mobileDarkToggle) mobileDarkToggle.checked = enabled;
        if (window.persistentSettings) window.persistentSettings.set('darkMode', enabled);
        
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'admin_dark_mode',
            newValue: enabled ? 'enabled' : 'disabled'
        }));
    }
    
    if (toggle) {
        toggle.addEventListener('click', () => syncDarkMode(!document.body.classList.contains('dark-mode')));
    }
    
    if (mobileDarkToggle) {
        mobileDarkToggle.addEventListener('change', (e) => syncDarkMode(e.target.checked));
    }
    
    window.addEventListener('storage', (e) => {
        if (e.key === 'admin_dark_mode') {
            const enabled = e.newValue === 'enabled';
            document.body.classList.toggle('dark-mode', enabled);
            if (toggle) {
                const sunIcon = toggle.querySelector('.sun-icon');
                const moonIcon = toggle.querySelector('.moon-icon');
                if (sunIcon && moonIcon) {
                    if (enabled) {
                        sunIcon.style.display = 'none';
                        moonIcon.style.display = 'block';
                    } else {
                        sunIcon.style.display = 'block';
                        moonIcon.style.display = 'none';
                    }
                }
            }
            if (mobileDarkToggle) mobileDarkToggle.checked = enabled;
            if (window.persistentSettings) window.persistentSettings.settings.darkMode = enabled;
        }
    });
}

// ============ SETTINGS MANAGER ============
class PersistentSettings {
    constructor() {
        this.settings = this.loadSettings();
    }

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

    getDefaultSettings() {
        return {
            adminName: '',
            emailNotifications: true,
            pushNotifications: false,
            defaultView: 'overview',
            darkMode: false,
            compactMode: false,
            autoRefresh: true,
            refreshInterval: 30,
            autoDeleteResolved: true,
            resolvedRetentionHours: 24,
            sessionTimeout: 60,
            lastUpdated: new Date().toISOString()
        };
    }

    saveSettings() {
        this.settings.lastUpdated = new Date().toISOString();
        localStorage.setItem('campus_care_admin_settings', JSON.stringify(this.settings));
        this.syncToSupabase();
        this.applySettingsToPage();
        return this.settings;
    }

    async syncToSupabase() {
        if (!currentAdminData || !currentAdminData.email) return;
        try {
            const { error } = await supabase
                .from('admin')
                .update({ settings: this.settings, updated_at: new Date().toISOString() })
                .eq('email', currentAdminData.email);
            if (error) console.error('Error syncing settings:', error);
        } catch (err) {
            console.error('Sync error:', err);
        }
    }

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
            console.error('Error loading settings:', err);
        }
    }

    get(key) {
        return this.settings[key];
    }

    set(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        this.updateUIElement(key, value);
        return this;
    }

    update(updates) {
        Object.assign(this.settings, updates);
        this.saveSettings();
        this.updateAllUI();
        return this;
    }

    applySettingsToPage() {
        this.applyDarkMode(this.settings.darkMode);
        this.applyCompactMode(this.settings.compactMode);
        this.setupAutoRefresh(this.settings.autoRefresh);
        this.applyNotificationSettings();
    }

    applyDarkMode(enabled) {
        const toggle = document.getElementById('darkModeToggle');
        const mobileToggle = document.getElementById('mobileDarkModeToggle');
        if (enabled) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('admin_dark_mode', 'enabled');
            if (toggle) {
                const sunIcon = toggle.querySelector('.sun-icon');
                const moonIcon = toggle.querySelector('.moon-icon');
                if (sunIcon) sunIcon.style.display = 'none';
                if (moonIcon) moonIcon.style.display = 'block';
            }
            if (mobileToggle) mobileToggle.checked = true;
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('admin_dark_mode', 'disabled');
            if (toggle) {
                const sunIcon = toggle.querySelector('.sun-icon');
                const moonIcon = toggle.querySelector('.moon-icon');
                if (sunIcon) sunIcon.style.display = 'block';
                if (moonIcon) moonIcon.style.display = 'none';
            }
            if (mobileToggle) mobileToggle.checked = false;
        }
        const darkModeCheckbox = document.getElementById('darkMode');
        if (darkModeCheckbox) darkModeCheckbox.checked = enabled;
    }

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
                    .compact-mode .page-header { padding: 12px 16px !important; margin-bottom: 16px !important; }
                    .compact-mode .settings-panel { padding: 16px 20px !important; }
                    .compact-mode .form-group input { padding: 6px 10px !important; }
                `;
                document.head.appendChild(style);
            }
        } else {
            document.body.classList.remove('compact-mode');
            const style = document.getElementById('compact-mode-styles');
            if (style) style.remove();
        }
    }

    setupAutoRefresh(enabled) {
        if (window.autoRefreshInterval) {
            clearInterval(window.autoRefreshInterval);
            window.autoRefreshInterval = null;
        }
        if (enabled && this.settings.refreshInterval) {
            window.autoRefreshInterval = setInterval(() => {
                if (typeof loadStats === 'function') loadStats();
            }, this.settings.refreshInterval * 1000);
        }
    }

    applyNotificationSettings() {
        if (this.settings.pushNotifications && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    }

    updateUIElement(key, value) {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = value;
            } else if (element.tagName === 'SELECT') {
                element.value = value;
            } else if (element.type === 'range') {
                element.value = value;
                const displayId = key === 'refreshInterval' ? 'refreshValue' : 'retentionValue';
                const display = document.getElementById(displayId);
                if (display) display.textContent = `${value}${key === 'refreshInterval' ? 's' : 'h'}`;
            } else {
                element.value = value;
            }
        }
    }

    updateAllUI() {
        const elements = ['emailNotifications', 'pushNotifications', 'defaultView', 'darkMode', 'compactMode', 'autoRefresh', 'refreshInterval', 'autoDeleteResolved', 'resolvedRetentionHours', 'sessionTimeout'];
        for (const key of elements) {
            this.updateUIElement(key, this.settings[key]);
        }
    }

    resetToDefault() {
        if (confirm('⚠️ Reset all settings to default? This will clear your preferences.')) {
            this.settings = this.getDefaultSettings();
            this.saveSettings();
            this.updateAllUI();
            this.applySettingsToPage();
            showMessage('Settings reset to default!', 'success');
            addInternalNotification('Settings Reset', 'All settings have been reset to default', false);
        }
    }

    exportSettings() {
        const data = JSON.stringify(this.settings, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `campus_care_settings_${new Date().toISOString().slice(0, 19)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showMessage('Settings exported!', 'success');
    }

    importSettings(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                this.settings = { ...this.settings, ...imported };
                this.saveSettings();
                this.updateAllUI();
                this.applySettingsToPage();
                showMessage('Settings imported successfully!', 'success');
                addInternalNotification('Settings Imported', 'Settings have been imported', false);
            } catch (err) {
                showMessage('Invalid settings file', 'error');
            }
        };
        reader.readAsText(file);
    }
}

window.persistentSettings = new PersistentSettings();

// ============ LOAD ADMIN DATA ============
async function loadAdminData() {
    try {
        const stored = localStorage.getItem('currentAdmin');
        if (!stored) {
            window.location.href = '/Assets/login/admin/admin.html';
            return;
        }
        
        currentAdminData = JSON.parse(stored);
        
        const { data, error } = await supabase
            .from('admin')
            .select('*')
            .eq('email', currentAdminData.email)
            .single();
        
        if (!error && data) {
            currentAdminData = data;
            localStorage.setItem('currentAdmin', JSON.stringify(data));
            if (data.settings) {
                window.persistentSettings.settings = { ...window.persistentSettings.settings, ...data.settings };
                localStorage.setItem('campus_care_admin_settings', JSON.stringify(window.persistentSettings.settings));
            }
        }
        
        await window.persistentSettings.loadFromSupabase();
        
        const adminName = currentAdminData.name || currentAdminData.email;
        const initials = adminName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        
        const nameInput = document.getElementById('adminFullName');
        const emailInput = document.getElementById('adminEmail');
        const roleInput = document.getElementById('adminRole');
        const createdInput = document.getElementById('adminCreatedAt');
        const drawerName = document.getElementById('drawerAdminName');
        const topName = document.getElementById('topAdminName');
        const drawerInitials = document.getElementById('drawerInitials');
        const mobileAdminName = document.getElementById('mobileAdminName');
        
        if (nameInput) nameInput.value = adminName;
        if (emailInput) emailInput.value = currentAdminData.email || '';
        if (roleInput) roleInput.value = currentAdminData.role || 'Administrator';
        if (createdInput) createdInput.value = currentAdminData.created_at ? new Date(currentAdminData.created_at).toLocaleDateString() : 'N/A';
        if (drawerName) drawerName.textContent = adminName;
        if (topName) topName.textContent = adminName.split(' ')[0] || 'Admin';
        if (drawerInitials) drawerInitials.textContent = initials;
        if (mobileAdminName) mobileAdminName.textContent = adminName;
        
        window.persistentSettings.applySettingsToPage();
        window.persistentSettings.updateAllUI();
        
        // Update notification status display
        const notificationStatus = document.getElementById('notificationStatus');
        if (notificationStatus && window.persistentSettings.get('pushNotifications')) {
            notificationStatus.textContent = 'Allowed';
        } else if (notificationStatus) {
            notificationStatus.textContent = 'Disabled';
        }
        
    } catch (err) {
        console.error('Load admin error:', err);
    }
}

// ============ SAVE PROFILE (DESKTOP) ============
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
        const mobileAdminName = document.getElementById('mobileAdminName');
        
        if (drawerName) drawerName.textContent = newName;
        if (topName) topName.textContent = newName.split(' ')[0];
        if (drawerInitials) drawerInitials.textContent = initials;
        if (mobileAdminName) mobileAdminName.textContent = newName;
        
        showMessage('Profile updated!', 'success');
        addInternalNotification('Profile Updated', 'Your profile information has been updated', false);
    } catch (err) {
        showMessage('Error: ' + err.message, 'error');
    }
}


// ============ SAVE PROFILE (MOBILE) ============
async function saveMobileProfile() {
    const newName = document.getElementById('mobileFullName').value.trim();
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
        const mobileAdminName = document.getElementById('mobileAdminName');
        
        if (drawerName) drawerName.textContent = newName;
        if (topName) topName.textContent = newName.split(' ')[0];
        if (drawerInitials) drawerInitials.textContent = initials;
        if (mobileAdminName) mobileAdminName.textContent = newName;
        
        showMessage('Profile updated!', 'success');
        addInternalNotification('Profile Updated', 'Your profile information has been updated', false);
        closeProfileModal();
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
        addInternalNotification('Password Changed', 'Your password has been updated', false);
    } catch (err) {
        showMessage('Error: ' + err.message, 'error');
    }
}

// ============ SAVE ALL PREFERENCES ============
function saveAllPreferences() {
    const defaultView = document.getElementById('defaultView')?.value || 'overview';
    const darkMode = document.getElementById('darkMode')?.checked || false;
    const compactMode = document.getElementById('compactMode')?.checked || false;
    const autoRefresh = document.getElementById('autoRefresh')?.checked || true;
    const refreshInterval = parseInt(document.getElementById('refreshInterval')?.value || 30);
    
    window.persistentSettings.update({
        defaultView: defaultView,
        darkMode: darkMode,
        compactMode: compactMode,
        autoRefresh: autoRefresh,
        refreshInterval: refreshInterval,
        lastUpdated: new Date().toISOString()
    });
    
    showMessage('All preferences saved!', 'success');
    addInternalNotification('Preferences Saved', 'Your preferences have been saved', false);
}

// ============ SAVE NOTIFICATION SETTINGS ============
function saveNotificationSettings() {
    const emailNotifications = document.getElementById('emailNotifications')?.checked || false;
    const pushNotifications = document.getElementById('pushNotifications')?.checked || false;
    
    window.persistentSettings.update({
        emailNotifications: emailNotifications,
        pushNotifications: pushNotifications
    });
    
    // Update mobile display
    const notificationStatus = document.getElementById('notificationStatus');
    if (notificationStatus) {
        notificationStatus.textContent = pushNotifications ? 'Allowed' : 'Disabled';
    }
    
    // Also update the mobile notification status if there's a separate display
    const mobileNotificationStatus = document.getElementById('mobileNotificationStatus');
    if (mobileNotificationStatus) {
        mobileNotificationStatus.textContent = pushNotifications ? 'Allowed' : 'Disabled';
    }
    
    showMessage('Notification settings saved!', 'success');
    addInternalNotification('Notification Settings', 'Your notification preferences have been updated', false);
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
    addInternalNotification('Data Settings Saved', 'Your data management settings have been updated', false);
}

// ============ LOAD STATS ============
async function loadStats() {
    try {
        const { count: incidentsCount } = await supabase.from('incident').select('*', { count: 'exact', head: true });
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
    const { data } = await supabase.from('incident').select('*');
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
    addInternalNotification('Data Exported', `Exported ${data.length} incidents to CSV`, false);
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
    addInternalNotification('Data Exported', `Exported ${data.length} students to CSV`, false);
}

// ============ CLEAR INCIDENTS ============
async function clearIncidents() {
    if (!confirm('⚠️ Delete ALL incidents? This cannot be undone!')) return;
    await supabase.from('incident').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    localStorage.setItem('campus_care_reports', '[]');
    showMessage('All incidents cleared', 'success');
    addInternalNotification('Data Cleared', 'All incidents have been cleared from the system', false);
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

// ============ MOBILE MODAL FUNCTIONS ============
function openProfileModal() {
    const modal = document.getElementById('profileModal');
    const mobileFullName = document.getElementById('mobileFullName');
    const mobileEmail = document.getElementById('mobileEmail');
    
    if (mobileFullName) mobileFullName.value = currentAdminData?.name || '';
    if (mobileEmail) mobileEmail.value = currentAdminData?.email || '';
    
    if (modal) modal.classList.add('active');
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) modal.classList.remove('active');
}

function openNotificationsModal() {
    // Show notification settings
    const pushNotifications = document.getElementById('pushNotifications');
    if (pushNotifications) {
        // Toggle or show settings
        pushNotifications.checked = !pushNotifications.checked;
        saveNotificationSettings();
    }
}

function openLanguageModal() {
    const modal = document.getElementById('languageModal');
    if (modal) modal.classList.add('active');
}

function closeLanguageModal() {
    const modal = document.getElementById('languageModal');
    if (modal) modal.classList.remove('active');
}

function selectLanguage(lang) {
    const selectedLanguage = document.getElementById('selectedLanguage');
    if (selectedLanguage) selectedLanguage.textContent = lang;
    closeLanguageModal();
    showMessage(`Language set to ${lang}`, 'success');
}

function openFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    const feedbackText = document.getElementById('feedbackText');
    if (feedbackText) feedbackText.value = '';
    if (modal) modal.classList.add('active');
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    if (modal) modal.classList.remove('active');
}

function sendFeedback() {
    const feedback = document.getElementById('feedbackText')?.value.trim();
    if (!feedback) {
        showMessage('Please enter your feedback', 'error');
        return;
    }
    // Here you can send feedback to your email or database
    showMessage('Thank you for your feedback!', 'success');
    addInternalNotification('Feedback Received', 'Thanks for sharing your thoughts!', false);
    closeFeedbackModal();
}

function confirmLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentStudent');
        localStorage.removeItem('currentAdmin');
        localStorage.removeItem('isAdminLoggedIn');
        window.location.href = '/Assets/Landing_page/land.html';
    }
}

// ============ NAVIGATION ============
function setupNavigation() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('overlay');
    const hamburger = document.getElementById('hamburger');
    const adminPill = document.getElementById('adminPill');
    const notificationBell = document.getElementById('notificationBell');
    
    if (notificationBell) {
        notificationBell.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleNotificationDropdown();
        });
    }
    
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
        logoutBtn.onclick = confirmLogout;
    }
    
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && drawer && hamburger && !drawer.contains(e.target) && !hamburger.contains(e.target)) {
            drawer.classList.remove('open');
            if (overlay) overlay.classList.remove('open');
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isNotificationDropdownOpen) {
            const dropdown = document.getElementById('notificationDropdown');
            if (dropdown) dropdown.classList.remove('show');
            isNotificationDropdownOpen = false;
        }
        if (e.key === 'Escape') {
            closeProfileModal();
            closeLanguageModal();
            closeFeedbackModal();
        }
    });
}

// ============ SETUP BUTTONS ============
function setupButtons() {
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const savePreferencesBtn = document.getElementById('savePreferencesBtn');
    const saveNotificationsBtn = document.getElementById('saveNotificationsBtn');
    const saveDataSettingsBtn = document.getElementById('saveDataSettingsBtn');
    const exportIncidentsBtn = document.getElementById('exportIncidentsBtn');
    const exportStudentsBtn = document.getElementById('exportStudentsBtn');
    const clearDataBtn = document.getElementById('clearDataBtn');
    const resetSettingsBtn = document.getElementById('resetSettingsBtn');
    const exportSettingsBtn = document.getElementById('exportSettingsBtn');
    const importSettingsBtn = document.getElementById('importSettingsBtn');
    const importSettingsInput = document.getElementById('importSettingsInput');
    
    if (saveProfileBtn) saveProfileBtn.onclick = saveProfile;
    if (changePasswordBtn) changePasswordBtn.onclick = changePassword;
    if (savePreferencesBtn) savePreferencesBtn.onclick = saveAllPreferences;
    if (saveNotificationsBtn) saveNotificationsBtn.onclick = saveNotificationSettings;
    if (saveDataSettingsBtn) saveDataSettingsBtn.onclick = saveDataSettings;
    if (exportIncidentsBtn) exportIncidentsBtn.onclick = exportIncidents;
    if (exportStudentsBtn) exportStudentsBtn.onclick = exportStudents;
    if (clearDataBtn) clearDataBtn.onclick = () => showConfirmModal('⚠️ Clear ALL incidents? This cannot be undone.', clearIncidents);
    
    if (resetSettingsBtn) {
        resetSettingsBtn.onclick = () => window.persistentSettings.resetToDefault();
    }
    
    if (exportSettingsBtn) {
        exportSettingsBtn.onclick = () => window.persistentSettings.exportSettings();
    }
    
    if (importSettingsBtn && importSettingsInput) {
        importSettingsBtn.onclick = () => importSettingsInput.click();
        importSettingsInput.onchange = (e) => {
            if (e.target.files.length) {
                window.persistentSettings.importSettings(e.target.files[0]);
                importSettingsInput.value = '';
            }
        };
    }
}

// ============ BOTTOM NAVIGATION ============
function initBottomNav() {
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    bottomNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            if (page === 'dashboard') window.location.href = '/Assets/Admin_dashboard/Admin.html';
            else if (page === 'incidents') window.location.href = '/Assets/Admin_dashboard/incident/incident.html';
            else if (page === 'users') window.location.href = '/Assets/Admin_dashboard/user_page/user.html';
            else if (page === 'settings') window.location.href = '/Assets/Admin_dashboard/settings/setting.html';
        });
    });
    
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', confirmLogout);
    }
}

// ============ INITIALIZE ============
async function init() {
    console.log('Initializing Settings page...');
    loadNotifications();
    initDarkMode();
    await loadAdminData();
    await loadStats();
    setupTabs();
    setupNavigation();
    setupButtons();
    initBottomNav();
    
    // Expose functions globally for HTML onclick
    window.openProfileModal = openProfileModal;
    window.closeProfileModal = closeProfileModal;
    window.saveMobileProfile = saveMobileProfile;
    window.openLanguageModal = openLanguageModal;
    window.closeLanguageModal = closeLanguageModal;
    window.selectLanguage = selectLanguage;
    window.openFeedbackModal = openFeedbackModal;
    window.closeFeedbackModal = closeFeedbackModal;
    window.sendFeedback = sendFeedback;
    window.confirmLogout = confirmLogout;
    window.closeModal = closeModal;
}

init();