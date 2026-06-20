const KHUMBUKA_CACHE_VERSION = 'khumbuka-v15-pwa-v2';
const STATIC_CACHE = `${KHUMBUKA_CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${KHUMBUKA_CACHE_VERSION}-runtime`;

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
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith('khumbuka-') && !key.startsWith(KHUMBUKA_CACHE_VERSION))
        .map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

function isSupabaseRequest(url) {
  return url.hostname.includes('supabase.co') || url.pathname.includes('/rest/v1/');
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return ['script', 'style', 'image', 'font'].includes(request.destination)
    || /\.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?|ttf)$/i.test(url.pathname);
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    return cached || caches.match('/offline.html');
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || networkPromise;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache Supabase/API calls. We want live restaurant data, not stale business data.
  if (url.origin !== self.location.origin || isSupabaseRequest(url)) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isStaticAsset(request)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
