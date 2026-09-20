// Aura Service Worker - Web Push & PWA Support
// Standard W3C Push API & Clients API

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {
    title: 'Aura',
    message: 'Tienes una nueva alerta en tu gestor de tareas.',
    url: '/#eventos',
  };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload.message = event.data.text();
    }
  }

  const title = payload.title || 'Aura';
  const body = payload.body || payload.message || '';
  const targetUrl = payload.url || '/#eventos';

  const options = {
    body: body,
    icon: payload.icon || '/icons/icon-192x192.svg',
    badge: payload.badge || '/icons/icon-192x192.svg',
    data: {
      url: targetUrl,
      timestamp: payload.timestamp || Date.now(),
    },
    vibrate: [150, 80, 150],
    tag: payload.tag || 'aura-notification-' + Date.now(),
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If an application window/tab is already open, focus it
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            if ('navigate' in client && targetUrl) {
              return client.navigate(targetUrl);
            }
            return client;
          }
        }
        // If no application window is open, open a new window at the target URL
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
