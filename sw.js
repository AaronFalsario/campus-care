// Service Worker for Push Notifications
const CACHE_NAME = 'campus-care-v1';

self.addEventListener('install', (event) => {
    console.log('Service Worker installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
});

self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    
    const options = {
        body: data.body || 'New incident reported',
        icon: '/Assets/Images/logo-192.png',
        badge: '/Assets/Images/logo-192.png',
        vibrate: [200, 100, 200],
        sound: '/Assets/sounds/notification.mp3',
        requireInteraction: data.urgent || false,
        actions: [
            {
                action: 'view',
                title: 'View Incident'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Campus Care Alert', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/Assets/Admin_dashboard/incident/incident.html')
        );
    } else {
        event.waitUntil(
            clients.openWindow('/Assets/Admin_dashboard/Admin.html')
        );
    }
});