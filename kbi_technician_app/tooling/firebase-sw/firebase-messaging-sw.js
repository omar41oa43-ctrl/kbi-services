import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported, onBackgroundMessage } from 'firebase/messaging/sw';

const app = initializeApp({
  apiKey: 'AIzaSyAHIaqGWUpjrQzfv1Y6BJl59S3u48gpchg',
  appId: '1:1078380307626:web:d5b860d9f1abcb54fa9cd3',
  messagingSenderId: '1078380307626',
  projectId: 'kbi2-f4f19',
  authDomain: 'kbi2-f4f19.firebaseapp.com',
  storageBucket: 'kbi2-f4f19.firebasestorage.app',
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => 'focus' in client);
      return existing ? existing.focus() : self.clients.openWindow('/');
    }),
  );
});

isSupported().then((supported) => {
  if (!supported) return;
  const messaging = getMessaging(app);
  onBackgroundMessage(messaging, ({ notification, data }) => {
    const title = notification?.title || data?.title;
    if (!title) return;
    self.registration.showNotification(title, {
      body: notification?.body || data?.body,
      icon: '/icons/Icon-192.png',
      badge: '/icons/Icon-192.png',
      data,
    });
  });
});
