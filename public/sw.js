/**
 * yamango Service Worker - Background Push Notifications & Deal Alerts
 * As-Suwayda & Al-Kafr, Syria
 */

const CACHE_NAME = 'yamango-v2'; // تم رفع الإصدار لتحديث الكاش
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// 1. Install Event - Cache essential shell assets & skip waiting
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('SW: Cache assets non-blocking warning:', err);
      });
    })
  );
});

// 2. Activate Event - Claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
    ])
  );
});

// 3. Push Event - Listen for incoming push notification payloads
self.addEventListener('push', (event) => {
  let data = {
    title: 'تنبيه جديد من منصة yamango',
    body: 'تم تسجيل نشاط جديد في سوق السيارات والآليات بالسويداء والكفر.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'yamango-deal-alert',
    data: {
      url: '/',
      timestamp: Date.now(),
      type: 'deal'
    }
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      const text = event.data.text();
      if (text) {
        data.body = text;
      }
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'yamango-notification',
    data: data.data || { url: '/' },
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    actions: [
      {
        action: 'open_deal',
        title: 'عرض الصفقة 🔍'
      },
      {
        action: 'dismiss',
        title: 'إغلاق ✕'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// 4. Notification Click Event - Focus existing tab or open new window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (client.postMessage) {
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: event.notification.data
            });
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// 5. Message Event - Direct trigger from client to show notification via Service Worker
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data.payload || {};
    if (title) {
      const defaultOptions = {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        dir: 'rtl',
        lang: 'ar',
        vibrate: [150, 80, 150],
        requireInteraction: false,
        actions: [
          { action: 'open_deal', title: 'عرض التفاصيل' },
          { action: 'dismiss', title: 'إغلاق' }
        ],
        ...options
      };

      event.waitUntil(
        self.registration.showNotification(title, defaultOptions)
      );
    }
  }

  if (event.data.type === 'PING') {
    event.ports && event.ports[0] && event.ports[0].postMessage({ status: 'PONG', time: Date.now() });
  }
});