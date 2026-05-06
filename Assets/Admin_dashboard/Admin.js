import { createClient } from '@supabase/supabase-js'

// Use environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

let allIncidents = [];
let currentFilter = 'all';
let incidentChart = null;
let currentIncidentId = null;
let currentAdmin = null;
let realtimeSubscription = null;
let isInitialLoad = true;
let pollingInterval = null;

// FIX: Flag to prevent storage-event-triggered reloads from looping
let isSavingToStorage = false;

// AUTO-DELETE RESOLVED INCIDENTS AFTER 24 HOURS
const RESOLVED_RETENTION_HOURS = 24;

// ============ NOTIFICATION SYSTEM ============
let notifications = [];
let notificationIdCounter = 0;
let isNotificationDropdownOpen = false;
let lastUrgentTime = 0;

// Load notifications from localStorage
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

// Save notifications to localStorage
function saveNotifications() {
    localStorage.setItem('admin_notifications', JSON.stringify(notifications));
    updateNotificationBadge();
}

// ========== REQUEST NOTIFICATION PERMISSION ==========
async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('✅ Notification permission granted');
            new Notification('Campus Care Admin', {
                body: 'Notifications enabled! You will receive alerts for new incidents.',
                icon: '/Assets/Images/logo.png'
            });
        } else {
            console.log('❌ Notification permission denied');
        }
    }
}

// ========== SEND PUSH NOTIFICATION ==========
function sendMobileNotification(title, body, isUrgent = false) {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return;
    }
    
    if (Notification.permission !== 'granted') {
        console.log('Notification permission not granted');
        return;
    }
    
    if (isUrgent) {
        const now = Date.now();
        if (now - lastUrgentTime < 10000) {
            console.log('Throttling urgent notification');
            return;
        }
        lastUrgentTime = now;
    }
    
    const notificationOptions = {
        body: body,
        icon: '/Assets/Images/logo.png',
        badge: '/Assets/Images/logo.png',
        vibrate: isUrgent ? [200, 100, 200, 100, 200] : [100, 50, 100],
        silent: false,
        requireInteraction: isUrgent,
        tag: `incident-${Date.now()}`,
        renotify: true
    };
    
    if (isUrgent) {
        notificationOptions.body = `🚨 URGENT: ${body}`;
    }
    
    const notification = new Notification(title, notificationOptions);
    
    notification.onclick = function() {
        window.focus();
        notification.close();
    };
    
    setTimeout(() => {
        notification.close();
    }, isUrgent ? 30000 : 10000);
}

// ========== CHECK FOR URGENT REPORT ==========
function checkForUrgentReport(incident) {
    console.log('🔔 Checking for urgent report:', incident);
    
    if (!incident) {
        console.log('No incident provided');
        return;
    }
    
    const isUrgent = incident.priority === 'high' || 
                    incident.priority === 'urgent' ||
                    incident.category === 'security';
    
    const notificationTitle = isUrgent ? '🚨 URGENT INCIDENT REPORTED' : '📋 New Incident Reported';
    const notificationBody = `${incident.name || incident.title}\n📍 Location: ${incident.location}\n⚠️ Priority: ${(incident.priority || 'medium').toUpperCase()}`;
    
    // Send browser notification
    sendMobileNotification(notificationTitle, notificationBody, isUrgent);
    
    // Add to internal notification list
    addInternalNotification(
        isUrgent ? '🚨 Urgent Incident' : 'New Incident',
        `${incident.name || incident.title} at ${incident.location}`,
        isUrgent
    );
    
    // Show toast notification
    showToastMessage(notificationBody, isUrgent ? 'urgent' : 'info');
    
    // Animate bell for urgent
    if (isUrgent) {
        const bell = document.getElementById('notificationBell');
        if (bell) {
            bell.classList.add('urgent');
            bell.style.animation = 'bellRing 0.5s ease infinite';
            setTimeout(() => {
                bell.classList.remove('urgent');
                bell.style.animation = '';
            }, 3000);
        }
    }
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        console.log('📱 Mobile device detected - using mobile notification methods');
        
        // For iOS, show an alert for urgent incidents (since iOS notifications are limited)
        if (isUrgent && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            // iOS requires user interaction for alerts, so we show a modal-style alert
            setTimeout(() => {
                const mobileAlert = document.createElement('div');
                mobileAlert.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: #DC2626;
                    color: white;
                    padding: 15px;
                    text-align: center;
                    z-index: 10001;
                    animation: slideDown 0.3s ease;
                    font-weight: bold;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    cursor: pointer;
                `;
                mobileAlert.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <span style="font-size: 24px;">🚨</span>
                        <div>
                            <div style="font-weight: bold; margin-bottom: 4px;">URGENT INCIDENT</div>
                            <div style="font-size: 12px;">${notificationBody.substring(0, 100)}</div>
                        </div>
                    </div>
                `;
                mobileAlert.onclick = () => {
                    window.focus();
                    mobileAlert.remove();
                    // Optional: navigate to incidents page
                    // window.location.href = '/Assets/Admin_dashboard/incident/incident.html';
                };
                document.body.appendChild(mobileAlert);
                setTimeout(() => mobileAlert.remove(), 8000);
            }, 500);
        }
        
        // Vibrate on mobile for urgent notifications
        if (isUrgent && navigator.vibrate) {
            navigator.vibrate([500, 200, 500, 200, 1000]);
            console.log('📳 Vibration triggered');
        }
        
        // Update app badge count on supported browsers (Android)
        if ('setAppBadge' in navigator && isUrgent) {
            const unreadCount = notifications.filter(n => !n.read).length;
            navigator.setAppBadge(unreadCount + 1).catch(console.log);
            console.log('🔴 App badge updated');
        }
        
        // Play a beep sound for mobile
        if (isUrgent) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscillator.frequency.value = 880;
                gainNode.gain.value = 0.3;
                oscillator.start();
                setTimeout(() => oscillator.stop(), 500);
                audioContext.resume();
            } catch (e) {
                console.log('Audio not supported on this device');
            }
        }
    }
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
    
    if (notifications.length > 50) notifications = notifications.slice(0, 50);
    
    saveNotifications();
    updateNotificationDropdown();
    
    console.log('✅ Notification added:', title, message);
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
                <p style="font-size: 11px; margin-top: 4px;">New incident reports will appear here</p>
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
                    <div class="notification-dropdown-title">${notif.isUrgent ? '🚨 ' : '📋 '}${escape(notif.title)}</div>
                    <div class="notification-dropdown-message">${escape(notif.message)}</div>
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
    showToastMessage('All notifications cleared', 'success');
};

function showToastMessage(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'urgent' ? '#DC2626' : (type === 'error' ? '#DC2626' : '#10B981')};
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: 'Inter', sans-serif;
        font-weight: 500;
        max-width: 350px;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============ DARK MODE SYSTEM ==========
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

// ============ LOAD ADMIN INFO TO DRAWER ==========
function loadAdminToDrawer() {
    try {
        const storedAdmin = localStorage.getItem('currentAdmin');
        const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
        
        if (!storedAdmin || isLoggedIn !== 'true') {
            return;
        }
        
        currentAdmin = JSON.parse(storedAdmin);
        const adminName = currentAdmin.name || currentAdmin.email;
        const adminInitials = adminName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        
        const drawerName = document.getElementById('drawerAdminName');
        const drawerRole = document.getElementById('drawerAdminRole');
        const drawerInitials = document.getElementById('drawerInitials');
        const topAdminName = document.getElementById('topAdminName');
        const welcomeMessage = document.getElementById('welcomeMessage');
        const adminPill = document.getElementById('adminPill');
        
        if (drawerName) drawerName.textContent = adminName;
        if (drawerRole) drawerRole.textContent = currentAdmin.role || 'Campus Care Admin';
        if (drawerInitials) drawerInitials.textContent = adminInitials;
        if (topAdminName) topAdminName.textContent = adminName.split(' ')[0] || 'Admin';
        if (adminPill) adminPill.textContent = adminName.split(' ')[0] || 'Admin';
        if (welcomeMessage) welcomeMessage.textContent = `Welcome back, ${adminName}! Manage incidents and monitor campus maintenance`;
        
    } catch (error) {
        console.error('Error loading admin to drawer:', error);
    }
}

// ============ LOAD INCIDENTS FROM SUPABASE ==========
async function loadIncidentsFromSupabase() {
    try {
        console.log('Loading incidents from Supabase...');
        
        const { data: incidents, error } = await supabase
            .from('incident')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Supabase error:', error);
            loadFromLocalStorage();
            return;
        }
        
        if (incidents && incidents.length > 0) {
            allIncidents = incidents.map(r => ({
                id: r.id,
                name: r.title || 'Untitled',
                location: r.location || 'No location',
                category: r.category || 'maintenance',
                priority: r.priority || 'medium',
                status: r.status || 'pending',
                reporter: r.student_name || 'Student',
                student_id: r.student_id_number || 'N/A',
                description: r.description || 'No description provided',
                image_url: r.image_url || null,
                timestamp: new Date(r.created_at),
                resolved_at: r.resolved_at || null,
                is_anonymous: r.is_anonymous || false
            }));
            
            saveToLocalStorage();
            console.log(`✅ Loaded ${allIncidents.length} incidents from Supabase`);
        } else {
            allIncidents = [];
            console.log('No incidents found in Supabase');
        }
        
        await checkAndDeleteOldResolved();
        updateAll();
        
    } catch (error) {
        console.error('Error loading from Supabase:', error);
        loadFromLocalStorage();
    }
}

async function loadFromLocalStorage() {
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
            timestamp: new Date(r.timestamp),
            resolved_at: r.resolved_at || null,
            is_anonymous: r.is_anonymous
        }));
    } else {
        allIncidents = [];
    }
    await checkAndDeleteOldResolved();
    updateAll();
}

// ============ REAL-TIME SUBSCRIPTION (FIXED) ==========
function setupRealtimeSubscription() {
    if (realtimeSubscription) return;
    
    console.log('Setting up real-time subscription for incident table...');
    
    realtimeSubscription = supabase
        .channel('incident-changes')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'incident' },
            (payload) => {
                console.log('🆕 NEW INCIDENT INSERTED INSTANTLY!', payload.new);
                
                // Convert payload to incident format
                const newIncident = {
                    id: payload.new.id,
                    name: payload.new.title || 'Untitled',
                    location: payload.new.location || 'No location',
                    category: payload.new.category || 'maintenance',
                    priority: payload.new.priority || 'medium',
                    status: payload.new.status || 'pending',
                    reporter: payload.new.student_name || 'Student',
                    student_id: payload.new.student_id_number || 'N/A',
                    description: payload.new.description || '',
                    image_url: payload.new.image_url || null,
                    timestamp: new Date(payload.new.created_at),
                    is_anonymous: payload.new.is_anonymous || false
                };
                
                // Send notification IMMEDIATELY
                checkForUrgentReport(newIncident);
                
                // Add to local array
                allIncidents.unshift(newIncident);
                
                // Update UI immediately
                updateAll();
                
                // Background sync
                loadIncidentsFromSupabase().catch(console.error);
            }
        )
        .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'incident' },
            (payload) => {
                console.log('🔄 Incident UPDATED instantly:', payload.new.id);
                
                if (payload.old?.status !== payload.new?.status) {
                    addInternalNotification(
                        'Status Updated',
                        `Incident "${payload.new?.title}" status changed from ${payload.old?.status} to ${payload.new?.status}`,
                        false
                    );
                    showToastMessage(`Status updated to ${payload.new?.status}`, 'info');
                }
                
                const index = allIncidents.findIndex(i => String(i.id) === String(payload.new.id));
                if (index !== -1) {
                    allIncidents[index] = {
                        ...allIncidents[index],
                        status: payload.new.status,
                        updated_at: payload.new.updated_at,
                        resolved_at: payload.new.resolved_at
                    };
                    updateAll();
                }
                
                loadIncidentsFromSupabase().catch(console.error);
            }
        )
        .on('postgres_changes', 
            { event: 'DELETE', schema: 'public', table: 'incident' },
            (payload) => {
                console.log('🗑️ Incident DELETED instantly');
                
                allIncidents = allIncidents.filter(i => String(i.id) !== String(payload.old.id));
                updateAll();
                
                addInternalNotification(
                    'Incident Deleted',
                    `An incident has been removed from the system`,
                    false
                );
                showToastMessage('Incident deleted', 'info');
            }
        )
        .subscribe((status) => {
            console.log('Realtime subscription status:', status);
            if (status === 'SUBSCRIBED') {
                console.log('%c✅ REAL-TIME ACTIVE! Notifications will appear instantly.', 'color: green; font-size: 14px; font-weight: bold');
            } else if (status === 'CHANNEL_WAITING') {
                console.log('%c⏳ Connecting to real-time...', 'color: orange; font-size: 14px');
                // Start polling fallback
                startPollingFallback();
            }
        });
}

// ============ POLLING FALLBACK (if realtime fails) ==========
function startPollingFallback() {
    if (pollingInterval) return;
    
    let lastKnownId = allIncidents.length > 0 ? allIncidents[0].id : null;
    
    console.log('Starting polling fallback (checks every 3 seconds)...');
    
    pollingInterval = setInterval(async () => {
        try {
            const { data, error } = await supabase
                .from('incident')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1);
            
            if (error) throw error;
            
            if (data && data.length > 0) {
                const latest = data[0];
                
                if (lastKnownId !== latest.id) {
                    console.log('🆕 Polling detected new incident!');
                    
                    const newIncident = {
                        id: latest.id,
                        name: latest.title || 'Untitled',
                        location: latest.location || 'No location',
                        category: latest.category || 'maintenance',
                        priority: latest.priority || 'medium',
                        status: latest.status || 'pending',
                        reporter: latest.student_name || 'Student',
                        student_id: latest.student_id_number || 'N/A',
                        description: latest.description || '',
                        image_url: latest.image_url || null,
                        timestamp: new Date(latest.created_at),
                        is_anonymous: latest.is_anonymous || false
                    };
                    
                    checkForUrgentReport(newIncident);
                    allIncidents.unshift(newIncident);
                    updateAll();
                    lastKnownId = latest.id;
                }
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 3000);
}

function stopPollingFallback() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
        console.log('Polling fallback stopped');
    }
}

// ============ UPDATE INCIDENT STATUS IN SUPABASE ==========
async function updateIncidentStatus(incidentId, newStatus, resolvedAt = null) {
    try {
        const updateData = {
            status: newStatus,
            updated_at: new Date().toISOString()
        };
        
        if (resolvedAt) {
            updateData.resolved_at = resolvedAt;
        }
        
        const { error } = await supabase
            .from('incident')
            .update(updateData)
            .eq('id', incidentId);
        
        if (error) {
            console.error('Error updating status in Supabase:', error);
            return false;
        }
        
        console.log('✅ Status updated in Supabase:', newStatus);
        return true;
        
    } catch (error) {
        console.error('Error updating status:', error);
        return false;
    }
}

function saveToLocalStorage() {
    isSavingToStorage = true;
    const toStore = allIncidents.map(i => ({
        id: i.id,
        title: i.name,
        location: i.location,
        category: i.category,
        priority: i.priority,
        status: i.status,
        studentName: i.reporter,
        description: i.description,
        timestamp: i.timestamp,
        imageUrl: i.image_url,
        studentIdNumber: i.student_id,
        resolved_at: i.resolved_at,
        is_anonymous: i.is_anonymous
    }));
    localStorage.setItem('campus_care_reports', JSON.stringify(toStore));
    setTimeout(() => { isSavingToStorage = false; }, 0);
}

// ============ AUTO-DELETE FUNCTIONS ==========
async function checkAndDeleteOldResolved() {
    const now = new Date();

    const toDelete = [];
    const toKeep = allIncidents.filter(incident => {
        if (incident.status !== 'resolved') return true;

        const resolvedTime = new Date(incident.resolved_at || incident.timestamp);
        const hoursSinceResolved = (now - resolvedTime) / (1000 * 60 * 60);

        if (hoursSinceResolved < RESOLVED_RETENTION_HOURS) {
            return true;
        } else {
            toDelete.push(incident);
            return false;
        }
    });

    if (toDelete.length === 0) return;

    for (const incident of toDelete) {
        console.log(`Deleting old resolved incident: ${incident.name}`);
        const { error } = await supabase
            .from('incident')
            .delete()
            .eq('id', incident.id);

        if (error) {
            console.error(`Failed to delete incident ${incident.id}:`, error);
            toKeep.push(incident);
        } else {
            console.log(`Deleted incident ${incident.id} from Supabase`);
            addInternalNotification('Incident Auto-Deleted', `"${incident.name}" was automatically deleted after 24 hours.`, false);
        }
    }

    allIncidents = toKeep;
    saveToLocalStorage();
}

function startAutoCleanupScheduler() {
    checkAndDeleteOldResolved();
    setInterval(async () => {
        await checkAndDeleteOldResolved();
        updateAll();
    }, 3600000);
}

function updateAll() { 
    updateStats(); 
    updateChart(); 
    updateTopCategories(); 
    renderIncidents(); 
    renderMobileCards(); 
}

function updateStats() {
    const total = allIncidents.length;
    const active = allIncidents.filter(i => i.status !== 'resolved').length;
    const resolved = allIncidents.filter(i => i.status === 'resolved').length;
    const rate = total ? Math.round((resolved / total) * 100) : 0;
    
    const totalReportsEl = document.getElementById('totalReports');
    const activeReportsEl = document.getElementById('activeReports');
    const resolvedRateEl = document.getElementById('resolvedRate');
    const avgResolutionEl = document.getElementById('avgResolution');
    
    if (totalReportsEl) totalReportsEl.textContent = total;
    if (activeReportsEl) activeReportsEl.textContent = active;
    if (resolvedRateEl) resolvedRateEl.textContent = rate + '%';
    if (avgResolutionEl) avgResolutionEl.textContent = total ? '42h' : '—';
    
    const cats = { security:0, maintenance:0, janitorial:0, facilities:0 };
    allIncidents.forEach(i => { if(cats[i.category] !== undefined) cats[i.category]++; });
    
    const securityEl = document.getElementById('securityCount');
    const maintenanceEl = document.getElementById('maintenanceCount');
    const janitorialEl = document.getElementById('janitorialCount');
    const facilitiesEl = document.getElementById('facilitiesCount');
    
    if (securityEl) securityEl.textContent = cats.security;
    if (maintenanceEl) maintenanceEl.textContent = cats.maintenance;
    if (janitorialEl) janitorialEl.textContent = cats.janitorial;
    if (facilitiesEl) facilitiesEl.textContent = cats.facilities;
}

function updateTopCategories() {
    const cats = { security:0, maintenance:0, janitorial:0, facilities:0 };
    allIncidents.forEach(i => { if(cats[i.category] !== undefined) cats[i.category]++; });
    
    const topSecurity = document.getElementById('topSecurity');
    const topMaintenance = document.getElementById('topMaintenance');
    const topJanitorial = document.getElementById('topJanitorial');
    const topFacilities = document.getElementById('topFacilities');
    
    if (topSecurity) topSecurity.textContent = cats.security;
    if (topMaintenance) topMaintenance.textContent = cats.maintenance;
    if (topJanitorial) topJanitorial.textContent = cats.janitorial;
    if (topFacilities) topFacilities.textContent = cats.facilities;
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
    const ctx = document.getElementById('incidentChart');
    if (ctx) {
        const canvasCtx = ctx.getContext('2d');
        if (incidentChart) incidentChart.destroy();
        incidentChart = new Chart(canvasCtx, {
            type: 'line',
            data: { labels: months, datasets: [{ label: 'Incidents', data: chartData, borderColor: '#1D9E75', backgroundColor: 'rgba(29,158,117,0.1)', borderWidth: 2, fill: true, tension: 0.3, pointBackgroundColor: '#1D9E75', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4 }] },
            options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#E4E1DB' }, ticks: { stepSize: 1 } }, x: { grid: { display: false } } } }
        });
    }
}

function getFiltered() {
    let filtered = [...allIncidents];
    if (currentFilter !== 'all') filtered = filtered.filter(i => i.status === currentFilter);
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function renderIncidents() {
    const tbody = document.getElementById('incidentsTableBody');
    if (!tbody) return;
    
    const filtered = getFiltered();
    if (filtered.length === 0) { 
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:60px;">📭 No incidents found</td></tr>`;
        return; 
    }
    
    tbody.innerHTML = filtered.map(inc => {
        const categoryColor = getCategoryColor(inc.category);
        const categoryBg = `${categoryColor}15`;
        
        return `
            <tr data-id="${inc.id}">
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 44px; height: 44px; border-radius: 12px; background: ${categoryBg}; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
                            ${getIcon(inc.category)}
                        </div>
                        <div>
                            <strong style="color: var(--text); font-size: 14px; display: block; margin-bottom: 4px;">${escape(inc.name)}</strong>
                            <span style="font-size: 11px; color: var(--muted);">${escape(inc.location)}</span>
                        </div>
                    </div>
                </td>
                <td><span class="badge b-${inc.category}">${inc.category}</span></td>
                <td><span class="badge b-${inc.priority}">${inc.priority}</span></td>
                <td><span class="badge b-${inc.status === 'in-progress' ? 'inprogress' : inc.status}">${inc.status}</span></td>
                <td style="color: var(--text);">${inc.is_anonymous === true ? 'Anonymous' : escape(inc.reporter)}</td>
                <td style="color: var(--text);">${inc.is_anonymous === true ? 'Hidden' : inc.student_id}</td>
                <td style="color: var(--muted);">${getTimeAgo(inc.timestamp)}</td>
                <td><div class="action-btns"><button class="action-btn" onclick="window.openModal('${inc.id}')">👁️</button></div></td>
            </tr>
        `;
    }).join('');
}

function renderMobileCards() {
    const container = document.getElementById('mobileCards');
    if (!container) return;
    
    const filtered = getFiltered();
    if (filtered.length === 0) { 
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; background: var(--surface); border-radius: 20px;">
                <div style="font-size: 48px; margin-bottom: 12px;">📭</div>
                <p style="color: var(--text); font-weight: 500;">No incidents found</p>
                <p style="color: var(--muted); font-size: 12px; margin-top: 4px;">All clear! No reports to display.</p>
            </div>
        `; 
        return; 
    }
    
    container.innerHTML = filtered.map(inc => {
        const categoryColor = getCategoryColor(inc.category);
        const categoryBg = `${categoryColor}15`;
        const priorityClass = inc.priority === 'high' ? 'priority-high' : (inc.priority === 'medium' ? 'priority-medium' : 'priority-low');
        
        return `
            <div class="m-card ${priorityClass}" data-id="${inc.id}">
                <div class="m-card-header">
                    <div class="m-card-icon" style="background: ${categoryBg}; color: ${categoryColor};">
                        ${getIcon(inc.category)}
                    </div>
                    <div class="m-card-info">
                        <div class="m-card-title">${escape(inc.name)}</div>
                        <div class="m-card-location">${escape(inc.location)}</div>
                    </div>
                </div>
                
                <div class="m-card-body">
                    <div class="m-card-field">
                        <div class="m-field-label">📂 CATEGORY</div>
                        <div class="m-field-value">
                            <span class="badge b-${inc.category}" style="background: ${categoryBg}; color: ${categoryColor};">${inc.category}</span>
                        </div>
                    </div>
                    <div class="m-card-field">
                        <div class="m-field-label">⚡ PRIORITY</div>
                        <div class="m-field-value">
                            <span class="badge b-${inc.priority}">${inc.priority}</span>
                        </div>
                    </div>
                    <div class="m-card-field">
                        <div class="m-field-label">📌 STATUS</div>
                        <div class="m-field-value">
                            <span class="badge b-${inc.status === 'in-progress' ? 'inprogress' : inc.status}">${inc.status}</span>
                        </div>
                    </div>
                    <div class="m-card-field">
                        <div class="m-field-label">👤 REPORTER</div>
                        <div class="m-field-value">${inc.is_anonymous === true ? 'Anonymous Reporter' : escape(inc.reporter)}</div>
                    </div>
                </div>
                
                <div class="m-card-footer">
                    <div class="m-timestamp">${getTimeAgo(inc.timestamp)}</div>
                    <div class="m-card-actions">
                        <button class="action-btn" onclick="window.openModal('${inc.id}')" title="View Details">👁️</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

window.openModal = function(id) {
    console.log('Opening modal for incident:', id);
    const inc = allIncidents.find(i => String(i.id) === String(id));
    if (!inc) {
        console.error('Incident not found:', id);
        showToastMessage('Incident not found', 'error');
        return;
    }
    currentIncidentId = id;
    
    const modalTitle = document.getElementById('modalTitle');
    const modalLocation = document.getElementById('modalLocation');
    const modalCategory = document.getElementById('modalCategory');
    const modalPriority = document.getElementById('modalPriority');
    const modalReporter = document.getElementById('modalReporter');
    const modalStudentId = document.getElementById('modalStudentId');
    const modalDate = document.getElementById('modalDate');
    const modalDescription = document.getElementById('modalDescription');
    const modalStatus = document.getElementById('modalStatus');
    
    if (modalTitle) modalTitle.innerText = inc.name;
    if (modalLocation) modalLocation.innerText = inc.location;
    if (modalCategory) modalCategory.innerHTML = `<span class="badge b-${inc.category}">${inc.category}</span>`;
    if (modalPriority) modalPriority.innerHTML = `<span class="badge b-${inc.priority}">${inc.priority}</span>`;
    if (modalReporter) modalReporter.innerText = inc.is_anonymous === true ? 'Anonymous Reporter' : inc.reporter;
    if (modalStudentId) modalStudentId.innerText = inc.is_anonymous === true ? 'Hidden' : inc.student_id;
    if (modalDate) modalDate.innerText = new Date(inc.timestamp).toLocaleString();
    if (modalDescription) modalDescription.innerText = inc.description || 'No description provided';
    if (modalStatus) modalStatus.value = inc.status;
    
    const modalImage = document.getElementById('modalImage');
    const noImageDiv = document.getElementById('noImage');
    
    if (modalImage && noImageDiv) {
        if (inc.image_url && inc.image_url !== 'null' && inc.image_url !== '' && inc.image_url !== 'undefined') {
            modalImage.src = inc.image_url;
            modalImage.style.display = 'block';
            noImageDiv.style.display = 'none';
            
            modalImage.onload = function() {
                console.log('Image loaded successfully for incident:', inc.id);
            };
            modalImage.onerror = function() {
                console.error('Image failed to load for incident:', inc.id);
                modalImage.style.display = 'none';
                noImageDiv.style.display = 'flex';
                noImageDiv.innerHTML = `
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <p>Image failed to load</p>
                    <p style="font-size: 11px;">The image URL may be invalid or corrupted</p>
                `;
            };
        } else {
            modalImage.style.display = 'none';
            noImageDiv.style.display = 'flex';
            noImageDiv.style.flexDirection = 'column';
            noImageDiv.style.alignItems = 'center';
            noImageDiv.innerHTML = `
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                </svg>
                <p>No image attached</p>
                <p style="font-size: 11px;">Student did not upload an image</p>
            `;
        }
    }
    
    const deletionInfo = document.getElementById('modalDeletionInfo');
    if (deletionInfo) {
        if (inc.status === 'resolved' && inc.resolved_at) {
            const resolvedDate = new Date(inc.resolved_at);
            const deleteDate = new Date(resolvedDate.getTime() + (RESOLVED_RETENTION_HOURS * 60 * 60 * 1000));
            const hoursLeft = Math.max(0, Math.floor((deleteDate - new Date()) / (1000 * 60 * 60)));
            deletionInfo.style.display = 'flex';
            const infoValue = deletionInfo.querySelector('.info-value');
            if (infoValue) infoValue.innerHTML = `⚠️ Will be deleted in ${hoursLeft} hours`;
        } else {
            deletionInfo.style.display = 'none';
        }
    }
    
    const modal = document.getElementById('incidentModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
};

window.closeModal = function() {
    const modal = document.getElementById('incidentModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
    currentIncidentId = null;
};

// ============ DELETE INCIDENT ============
window.deleteIncident = async function(id) {
    const incident = allIncidents.find(i => String(i.id) === String(id));
    if (!incident) return;

    const confirmed = confirm(`Are you sure you want to permanently delete this incident?\n\n"${incident.name}"\n\nThis cannot be undone.`);
    if (!confirmed) return;

    const { error } = await supabase
        .from('incident')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Delete failed:', error);
        showToastMessage('❌ Failed to delete incident: ' + (error.message || 'Unknown error'), 'error');
        return;
    }

    console.log('✅ Incident deleted from Supabase:', id);
    showToastMessage('✓ Incident permanently deleted.');
    addInternalNotification('Incident Deleted', `"${incident.name}" was deleted by an admin`, false);

    allIncidents = allIncidents.filter(i => String(i.id) !== String(id));
    saveToLocalStorage();
    updateAll();
    closeModal();
};

// ============ SAVE STATUS ============
window.saveStatus = async function() {
    if (!currentIncidentId) return;
    
    const newStatus = document.getElementById('modalStatus').value;
    const incident = allIncidents.find(i => String(i.id) === String(currentIncidentId));
    
    if (!incident) return;
    
    if (newStatus !== incident.status) {
        const oldStatus = incident.status;
        let resolvedAt = null;
        
        if (newStatus === 'resolved' && oldStatus !== 'resolved') {
            resolvedAt = new Date().toISOString();
            showToastMessage(`✓ Incident marked as RESOLVED. It will be automatically deleted after ${RESOLVED_RETENTION_HOURS} hours.`);
        } else if (newStatus !== 'resolved' && oldStatus === 'resolved') {
            resolvedAt = null;
            showToastMessage(`✓ Status updated to ${newStatus}`);
        } else {
            showToastMessage(`✓ Status updated to ${newStatus}`);
        }
        
        incident.status = newStatus;
        incident.resolved_at = resolvedAt;
        
        const success = await updateIncidentStatus(currentIncidentId, newStatus, resolvedAt);
        
        if (success) {
            saveToLocalStorage();
            updateAll();
        } else {
            showToastMessage('❌ Failed to update status. Please try again.', 'error');
            incident.status = oldStatus;
            incident.resolved_at = null;
            updateAll();
        }
    }
    
    closeModal();
};

function getIcon(cat) { return { security:'⚠️', maintenance:'🔧', janitorial:'🧹', facilities:'🏢' }[cat] || '📋'; }
function getCategoryColor(cat) { return { security:'#DC2626', maintenance:'#2563EB', janitorial:'#1D9E75', facilities:'#D97706' }[cat] || '#6B7280'; }
function getTimeAgo(date) { const h = Math.floor((Date.now() - new Date(date)) / 3600000); if (h < 1) return 'Just now'; if (h < 24) return `${h}h ago`; return `${Math.floor(h/24)}d ago`; }
function escape(t) { if (!t) return ''; return String(t).replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m])); }

function setupEvents() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('overlay');
    const adminPill = document.getElementById('adminPill');
    const notificationBell = document.getElementById('notificationBell');
    
    // Removed hamburger code completely
    
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
    
    if (notificationBell) {
        notificationBell.onclick = (e) => {
            e.stopPropagation();
            toggleNotificationDropdown();
        };
    }
    
    document.querySelectorAll('.filter-chip').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderIncidents(); 
            renderMobileCards();
        };
    });
    
    document.querySelectorAll('.drawer-item').forEach(item => {
        item.onclick = () => {
            const page = item.dataset.page;
            if (page === 'incidents') window.location.href = '/Assets/Admin_dashboard/incident/incident.html';
            else if (page === 'users') window.location.href = '/Assets/Admin_dashboard/user_page/user.html';
            else if (page === 'analytics') window.location.href = '/Assets/Admin_dashboard/analytics/analytics.html';
            else if (page === 'settings') window.location.href = '/Assets/Admin_dashboard/settings/setting.html';
            else if (page !== 'dashboard') window.location.href = '/Assets/Admin_dashboard/Admin.html';
            if (drawer) drawer.classList.remove('open'); 
            if (overlay) overlay.classList.remove('open');
        };
    });
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = () => { 
            if (confirm('Are you sure you want to logout?')) { 
                localStorage.removeItem('currentStudent'); 
                localStorage.removeItem('currentAdmin');
                localStorage.removeItem('isAdminLoggedIn');
                window.location.href = '/land.html'; 
            } 
        };
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isNotificationDropdownOpen) {
            const dropdown = document.getElementById('notificationDropdown');
            if (dropdown) dropdown.classList.remove('show');
            isNotificationDropdownOpen = false;
        }
    });
    
    // Removed the click event that referenced hamburger
    document.addEventListener('click', (e) => { 
        if (window.innerWidth <= 768 && drawer && !drawer.contains(e.target)) { 
            drawer.classList.remove('open'); 
            if (overlay) overlay.classList.remove('open'); 
        } 
    });
}

// Bottom Navigation JavaScript for Admin Dashboard
(function() {
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    
    function getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('Admin.html') || path.includes('dashboard')) return 'dashboard';
        if (path.includes('incident')) return 'incidents';
        if (path.includes('user_page')) return 'users';
        if (path.includes('setting')) return 'settings';
        return 'dashboard';
    }
    
    function highlightActiveNav() {
        const currentPage = getCurrentPage();
        bottomNavItems.forEach(item => {
            const page = item.dataset.page;
            if (page === currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    bottomNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            
            if (page === 'dashboard') {
                window.location.href = '/Assets/Admin_dashboard/Admin.html';
            } else if (page === 'incidents') {
                window.location.href = '/Assets/Admin_dashboard/incident/incident.html';
            } else if (page === 'users') {
                window.location.href = '/Assets/Admin_dashboard/user_page/user.html'
            } else if (page === 'analytics') {
                window.location.href = '/Assets/Admin_dashboard/analytics/analytics.html';
            } else if (page === 'settings') {
                window.location.href = '/Assets/Admin_dashboard/settings/setting.html';
            }
            
        });
    });
    
    highlightActiveNav();
})();

// Add CSS for bell animation
const style = document.createElement('style');
style.textContent = `
    @keyframes bellRing {
        0% { transform: rotate(0deg); }
        25% { transform: rotate(15deg); }
        50% { transform: rotate(-15deg); }
        75% { transform: rotate(5deg); }
        100% { transform: rotate(0deg); }
    }
    
    #notificationBell.urgent {
        animation: bellRing 0.5s ease infinite;
        color: #DC2626 !important;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .toast-notification.urgent {
        background: #DC2626 !important;
        animation: slideIn 0.3s ease, pulse 0.5s ease 3;
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
`;
document.head.appendChild(style);

// ============ FINAL CHECK - TEST NOTIFICATION FUNCTION ==========
window.testNotification = function() {
    console.log('Testing notification system...');
    
    const testIncident = {
        id: 'test-' + Date.now(),
        name: 'Test Incident',
        title: 'Test Incident',
        location: 'Test Location',
        category: 'maintenance',
        priority: 'high',
        status: 'pending',
        reporter: 'Test Student',
        student_id: 'TEST001',
        description: 'This is a test notification',
        timestamp: new Date(),
        is_anonymous: false
    };
    
    checkForUrgentReport(testIncident);
    showToastMessage('Test notification sent! Check your notifications.', 'info');
};

// ============ INITIALIZATION ==========
async function init() {
    console.log('🚀 Initializing Admin Dashboard...');
    
    // FIX: Force reset filter to 'all' on tablets
    currentFilter = 'all';
    
    // FIX: Ensure filter chips show correctly
    setTimeout(() => {
        const activeChip = document.querySelector('.filter-chip.active');
        if (!activeChip) {
            const allChip = document.querySelector('.filter-chip[data-filter="all"]');
            if (allChip) allChip.classList.add('active');
        }
    }, 100);
    
    loadAdminToDrawer();
    loadNotifications();
    initDarkMode();
    await loadIncidentsFromSupabase();
    setupEvents();
    startAutoCleanupScheduler();
    setupRealtimeSubscription();
    
    // FIX: Force display after loading
    setTimeout(() => {
        console.log('🔄 Forcing display refresh...');
        console.log('Total incidents loaded:', allIncidents.length);
        console.log('Current filter:', currentFilter);
        updateAll();
        
        // Log urgent incidents
        const urgentIncidents = allIncidents.filter(i => i.priority === 'high' || i.priority === 'urgent');
        console.log('Urgent incidents:', urgentIncidents.length);
    }, 500);
    
    // Request notification permission on page load
    setTimeout(() => {
        requestNotificationPermission();
    }, 2000);
    
    // Log connection status
    setTimeout(() => {
        if (realtimeSubscription) {
            console.log('📡 Realtime subscription state:', realtimeSubscription.state);
        }
    }, 5000);

    window.addEventListener('storage', (e) => { 
        if (e.key === 'campus_care_reports' && !isSavingToStorage) { 
            console.log('Storage event from another tab - reloading incidents');
            loadIncidentsFromSupabase(); 
        } 
    }); 
}

// ============ TABLET FIX - FORCE SHOW ALL INCIDENTS ============
window.forceShowAllIncidents = function() {
    console.log('🔧 Force showing all incidents...');
    currentFilter = 'all';
    
    // Update filter chips
    document.querySelectorAll('.filter-chip').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === 'all') {
            btn.classList.add('active');
        }
    });
    
    updateAll();
    showToastMessage('Showing all incidents', 'success');
};

// ============ DEBUG FUNCTION FOR TABLET ============
window.debugIncidents = function() {
    console.log('=== DEBUG INCIDENTS ===');
    console.log('Total incidents:', allIncidents.length);
    console.log('Current filter:', currentFilter);
    console.log('All incidents list:', allIncidents);
    console.log('Filtered incidents:', getFiltered());
    console.log('Urgent incidents:', allIncidents.filter(i => i.priority === 'high' || i.priority === 'urgent'));
    
    // Check DOM elements
    const tableBody = document.getElementById('incidentsTableBody');
    const mobileContainer = document.getElementById('mobileCards');
    console.log('Table body exists:', !!tableBody);
    console.log('Mobile container exists:', !!mobileContainer);
    
    // Force refresh
    updateAll();
    
    return {
        total: allIncidents.length,
        filter: currentFilter,
        filtered: getFiltered().length,
        urgent: allIncidents.filter(i => i.priority === 'high' || i.priority === 'urgent').length
    };
};

// Start the dashboard
init();