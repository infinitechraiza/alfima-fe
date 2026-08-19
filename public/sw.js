self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

// ── Push received (works even when app is fully closed) ───────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    if (event.data) data = event.data.json();
  } catch {
    data = {
      title: 'New Inquiry — ALFIMA Realty',
      body:  event.data ? event.data.text() : 'You have a new inquiry.',
      badge: 1,
      url:   '/agent/dashboard',
    };
  }

  const title   = data.title ?? 'New Inquiry — ALFIMA Realty';
  const badgeCount = data.badge ?? 1;

  const options = {
    body:  data.body  ?? 'You have a new inquiry.',
    icon:  '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag:   'new-inquiry',         // replaces previous notification of same type
    renotify: true,               // vibrate/sound even when replacing same tag
    data:  { url: data.url ?? '/agent/dashboard', count: badgeCount },
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      // Set numeric badge on app icon (Android/desktop)
      self.registration.badge != null
        ? self.registration.setBadge(badgeCount)
        : Promise.resolve(),
    ])
  );
});

// ── User taps notification ────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/agent/dashboard';

  // Clear the app icon badge
  if (self.registration.badge != null) {
    self.registration.clearBadge();
  }

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
  );
});

// ── Message from app (e.g. clear badge when user opens dashboard) ─────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'CLEAR_BADGE') {
    if (self.registration.badge != null) {
      self.registration.clearBadge();
    }
  }
});