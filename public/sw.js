// AriaHR Progressive Web App Service Worker
// Network-first for application code (scripts/styles) so a rebuilt bundle is
// picked up on the next load; cache-first only for immutable media.
// Network-only for API requests, authentication, and user data.

// Bumped whenever the caching policy changes: `activate` deletes every other
// cache, so clients that still hold an older bundle are purged once.
const CACHE_NAME = 'aria-hr-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/assets/logo/logo.png',
  '/assets/fonts/IRANSans.woff',
  '/assets/fonts/IRANSans.ttf',
  '/assets/fonts/IRANSans.eot',
];

/** Scripts and styles must never be pinned: their file names are stable in dev. */
function isApplicationCode(pathname) {
  return pathname.endsWith('.js') || pathname.endsWith('.css');
}

/** Media with content-derived names can be served from cache without staleness risk. */
function isCacheableMedia(pathname) {
  return (
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.ttf') ||
    pathname.endsWith('.eot') ||
    pathname.endsWith('.ico')
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        // Continue even if some individual asset fails to precache
        console.warn('[SW] Precache incomplete:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. NEVER cache any API requests, authentication calls, or non-GET requests
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/auth/') ||
    url.pathname.includes('/requests/') ||
    url.pathname.includes('/notifications/') ||
    url.pathname.includes('/organizations/') ||
    url.pathname.includes('/employees/')
  ) {
    return; // Pass through directly to network without caching
  }

  // 2. Navigation requests: always revalidate index.html so a new build's
  //    script URLs are picked up, with the cached shell only as an offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // 3. Application code: network-first, cache only as an offline fallback.
  if (isApplicationCode(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => caches.match(request).then((cached) => cached || Response.error()))
    );
    return;
  }

  // 4. Media: cache-first with network fallback.
  if (isCacheableMedia(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          }
          return networkResponse;
        });
      })
    );
  }
});
