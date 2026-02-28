/* eslint-disable no-undef */
// Firebase Cloud Messaging Service Worker
// This file MUST be in the public/ root directory

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Firebase config will be sent via postMessage from the app
// For now, initialize with empty config — it gets replaced at runtime
firebase.initializeApp({
    apiKey: true, // placeholder — real config is injected by the SDK
    projectId: true,
    messagingSenderId: true,
    appId: true,
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'Shubh Nirman';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification',
        icon: '/icon.png',
        badge: '/icon.png',
        data: payload.data,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return clients.openWindow('/');
        })
    );
});
