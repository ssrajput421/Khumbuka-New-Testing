/* Khumbuka PWA Service Worker
   Strategy:
   - Supabase/API data: network-only, never cached
   - HTML/CSS/JS: network-first, fallback to cache/offline page
   - Images/icons/fonts: cache-first
   - New app versions: detected by pwa.js and activated only when user clicks Update
*/

const KHUMBUKA_CACHE_VERSION = 'khumbuka-v15-pwa-v3';
const STATIC_CACHE = `${KHUMBUKA_CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${KHUMBUKA_CACHE_VERSION}-runtime`;
const IMAGE_CACHE = `${KHUMBUKA_CACHE_VERSION}-images`;

const APP_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/css/style.css',
  '/css/pwa.css',
  '/js/pwa.js',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL.map((url) => new Request(url, { cache: 'reload' }))))
      .catch((error) => console.warn('[Khumbuka SW] App shell cache failed:', error))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('khumbuka-') && !key.startsWith(KHUMBUKA_CACHE_VERSION))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  const message = event.data || {};

  if (message.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (message.type === 'CLEAR_RUNTIME_CACHE') {
    event.waitUntil(
      Promise.all([
        caches.delete(RUNTIME_CACHE),
        caches.delete(STATIC_CACHE)
      ])
    );
  }
});

function isSupabaseRequest(url) {
  return url.hostname.includes('supabase.co')
    || url.pathname.includes('/rest/v1/')
    || url.pathname.includes('/auth/v1/')
    || url.pathname.includes('/storage/v1/')
    || url.pathname.includes('/realtime/v1/');
}

function isAppCode(request) {
  const url = new URL(request.url);
  return ['document', 'script', 'style', 'worker'].includes(request.destination)
    || /\.(html|js|css|json|webmanifest)$/i.test(url.pathname);
}

function isImageOrFont(request) {
  const url = new URL(request.url);
  return ['image', 'font'].includes(request.destination)
    || /\.(png|jpg|jpeg|webp|svg|ico|woff2?|ttf|otf)$/i.test(url.pathname);
}

async function networkOnly(request) {
  return fetch(new Request(request, { cache: 'no-store' }));
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const freshRequest = new Request(request, { cache: 'no-store' });
    const response = await fetch(freshRequest);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;

    if (request.mode === 'navigate' || request.destination === 'document') {
      return caches.match('/offline.html');
    }

    return new Response('', {
      status: 503,
      statusText: 'Offline'
    });
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('', {
      status: 503,
      statusText: 'Offline'
    });
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache Supabase or external API data. Khumbuka business numbers must stay fresh.
  if (isSupabaseRequest(url)) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Let unrelated third-party assets pass through normally.
  if (url.origin !== self.location.origin) {
    return;
  }

  // Page navigation and app source files should prefer latest Netlify deployment.
  if (request.mode === 'navigate' || isAppCode(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Images/icons/fonts are safe to cache aggressively.
  if (isImageOrFont(request)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
