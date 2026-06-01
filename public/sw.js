// Service worker for Kitchen KDS Web Push and Alert notifications
const CACHE_NAME = 'kds-push-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listener for authentic Web Push messages
self.addEventListener('push', (event) => {
  let data = {
    title: '👨‍🍳 KDS Alerta de Comanda',
    body: 'Nuevo pedido entrante en la cocina.',
    icon: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=128&q=80',
    badge: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=128&q=80',
    tag: 'kds-order-alert',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      // If client sent plain text instead of JSON
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=128&q=80',
    badge: data.badge || 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=128&q=80',
    tag: data.tag || 'kds-order-push-tag',
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 400],
    data: data.data || { url: '/' },
    actions: [
      { action: 'open_kds', title: '🍳 Ver Comandas' },
      { action: 'close', title: 'Silenciar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Listener for simulated push messages via standard message channel (from the app itself for instant fidelity testing!)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SIMULATE_PUSH') {
    const payload = event.data.payload;
    const options = {
      body: payload.body || 'Nueva orden en preparación.',
      icon: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=128&q=80',
      badge: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=128&q=80',
      tag: payload.tag || 'kds-order-push-tag',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      data: { url: '/' },
      actions: [
        { action: 'open_kds', title: '🍳 Abrir KDS' },
        { action: 'close', title: 'Entendido' }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(payload.title || '👨‍🍳 KDS Alerta local', options)
    );
  }
});

// Click action handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Focus existing KDS tab or open a new one
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
