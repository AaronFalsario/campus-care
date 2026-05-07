// /Assets/bottom-nav.js - FIXED (No duplicate on page change)
(function() {
    // Check if bottom nav already exists in THIS page
    if (document.querySelector('.simple-bottom-nav')) {
        console.log('Bottom nav already exists on this page, skipping creation');
        // Just update the active state
        updateActiveState();
        return;
    }
    
    const navHTML = `
        <nav class="simple-bottom-nav">
            <button class="simple-bottom-nav-item" data-nav="home">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                </svg>
                <span>Home</span>
            </button>
            <button class="simple-bottom-nav-item" data-nav="incidents">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span>Incidents</span>
            </button>
            <button class="simple-bottom-nav-item" data-nav="users">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span>Users</span>
            </button>
            <button class="simple-bottom-nav-item" data-nav="analytics">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M21 12a9 9 0 1 1-9-9"/>
                    <path d="M12 3v9h9"/>
                    <path d="M12 12 22 2"/>
                </svg>
                <span>Analytics</span>
            </button>
            <button class="simple-bottom-nav-item" data-nav="settings">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                </svg>
                <span>Settings</span>
            </button>
        </nav>
    `;
    
    // Add CSS styles (only once)
    function addStyles() {
        if (document.getElementById('bottom-nav-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'bottom-nav-styles';
        style.textContent = `
            .simple-bottom-nav {
                display: none;
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: 65px;
                background: var(--surface, #FFFFFF);
                border-top: 1px solid var(--border, #E4E1DB);
                align-items: center;
                justify-content: space-evenly;
                padding: 8px 12px;
                z-index: 10000;
                box-shadow: 0 -2px 10px rgba(0,0,0,0.08);
            }
            body.dark-mode .simple-bottom-nav {
                background: #1E293B;
                border-top-color: #334155;
            }
            .simple-bottom-nav-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 4px;
                background: none;
                border: none;
                cursor: pointer;
                padding: 6px 10px;
                border-radius: 30px;
                color: var(--muted, #7A776F);
                font-size: 11px;
                font-weight: 500;
                flex: 1;
                max-width: 70px;
                transition: all 0.2s ease;
            }
            body.dark-mode .simple-bottom-nav-item {
                color: #94A3B8;
            }
            .simple-bottom-nav-item svg {
                width: 22px;
                height: 22px;
                stroke: currentColor;
            }
            .simple-bottom-nav-item span {
                font-size: 10px;
                font-weight: 500;
            }
            .simple-bottom-nav-item.active {
                color: var(--teal, #1D9E75);
                background: var(--teal-light, #E1F5EE);
            }
            body.dark-mode .simple-bottom-nav-item.active {
                color: #10B981;
                background: #064E3B;
            }
            .simple-bottom-nav-item:active {
                transform: scale(0.95);
            }
            @media (max-width: 768px) {
                .simple-bottom-nav {
                    display: flex !important;
                }
                body {
                    padding-bottom: 65px !important;
                }
            }
            @media (min-width: 769px) {
                .simple-bottom-nav {
                    display: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Update which button is active based on current page
    function updateActiveState() {
        const currentPath = window.location.pathname;
        const navItems = document.querySelectorAll('.simple-bottom-nav-item');
        
        navItems.forEach(item => {
            item.classList.remove('active');
            const nav = item.getAttribute('data-nav');
            
            if ((nav === 'home' && (currentPath.includes('Admin.html') || currentPath === '/' || currentPath === '')) ||
                (nav === 'incidents' && currentPath.includes('incident')) ||
                (nav === 'users' && currentPath.includes('user_page')) ||
                (nav === 'analytics' && currentPath.includes('analytics')) ||
                (nav === 'settings' && currentPath.includes('setting'))) {
                item.classList.add('active');
            }
        });
    }
    
    // Insert navigation into the page
    function insertNav() {
        // Double check if nav already exists
        if (document.querySelector('.simple-bottom-nav')) {
            // Just update active state
            updateActiveState();
            return;
        }
        
        // Insert the navigation HTML
        document.body.insertAdjacentHTML('beforeend', navHTML);
        
        // Add click handlers to buttons
        const navItems = document.querySelectorAll('.simple-bottom-nav-item');
        navItems.forEach(item => {
            // Remove any existing listeners by cloning and replacing
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            newItem.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const nav = this.getAttribute('data-nav');
                const paths = {
                    home: '/Assets/Admin_dashboard/Admin.html',
                    incidents: '/Assets/Admin_dashboard/incident/incident.html',
                    users: '/Assets/Admin_dashboard/user_page/user.html',
                    analytics: '/Assets/Admin_dashboard/analytics/analytics.html',
                    settings: '/Assets/Admin_dashboard/settings/setting.html'
                };
                
                if (paths[nav]) {
                    // Simple direct navigation
                    window.location.href = paths[nav];
                }
            });
        });
        
        // Set active state
        updateActiveState();
    }
    
    // Initialize styles (only once)
    addStyles();
    
    // Insert navigation when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', insertNav);
    } else {
        insertNav();
    }
})();