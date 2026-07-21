const CACHE_NAME = 'esss-science-portal-v35';
const RUNTIME_CACHE = 'esss-science-portal-runtime-v35';

// Assets to pre-cache immediately on service worker install
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './modules-data.js',
  './esss-logo.png',
  './esss-logo-white.png',
  './esss-badge.png',
  './manifest.json',

  // Lunar Explorer Core
  './modules/lunar-explorer/index.html',
  './modules/lunar-explorer/app.js',
  './modules/lunar-explorer/style.css',
  './modules/lunar-explorer/data.js',
  './modules/lunar-explorer/translations.xml',

  // Cosmic Ladder Core
  './modules/cosmic-ladder/index.html',
  './modules/cosmic-ladder/app.js',
  './modules/cosmic-ladder/style.css',
  './modules/cosmic-ladder/wiki-content.js',

  // Exoplanet Lab Core
  './modules/exoplanet-lab/index.html',
  './modules/exoplanet-lab/app.js',
  './modules/exoplanet-lab/style.css',

  // Slingshot Sandbox Core
  './modules/slingshot-sandbox/index.html',
  './modules/slingshot-sandbox/app.js',
  './modules/slingshot-sandbox/style.css',

  // Rocket Ballistics Core
  './modules/rocket-ballistics/index.html',
  './modules/rocket-ballistics/app.js',
  './modules/rocket-ballistics/style.css',

  // Satellite Doppler Core
  './modules/satellite-doppler/index.html',
  './modules/satellite-doppler/app.js',
  './modules/satellite-doppler/style.css',

  // Aperture Synthesis Core
  './modules/aperture-synthesis/index.html',
  './modules/aperture-synthesis/app.js',
  './modules/aperture-synthesis/style.css',

  // Orbital Mechanics Core
  './modules/orbital-mechanics/index.html',
  './modules/orbital-mechanics/app.js',
  './modules/orbital-mechanics/style.css',

  // Walk in the Solar System Core
  './modules/walk-in-solar-system/index.html',
  './modules/walk-in-solar-system/translations.js',

  // Eclipses & Transits Core
  './modules/eclipses-transits/index.html',
  './modules/eclipses-transits/app.js',
  './modules/eclipses-transits/style.css',
  './modules/eclipses-transits/astronomy-helper.js'
];

// Install Event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching offline assets...');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - clean up old caches
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass Service Worker for Next.js engine files, HMR, API calls, and Next routes
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.includes('webpack-hmr') ||
    url.pathname.includes('turbopack')
  ) {
    return;
  }

  // Network-First for HTML documents to ensure user changes show up immediately without stale cache delays
  const isHTML = event.request.mode === 'navigate' || 
                 (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'));

  if (isHTML) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then(cache => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then(cached => {
            if (cached) return cached;
            return new Response(
              '<div style="text-align:center;padding:50px;font-family:\'Inter\',sans-serif;background:#060814;color:#e8edff;height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;">' +
              '<h1 style="font-family:\'Outfit\',sans-serif;font-size:2.5rem;margin-bottom:10px;background:linear-gradient(135deg,#5aa6ff,#ffce4d);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Connection Offline</h1>' +
              '<p style="color:#8b97c4;max-width:400px;line-height:1.6;margin-bottom:24px;">You are currently offline.</p>' +
              '<a href="/" style="color:#e8edff;text-decoration:none;border:1px solid rgba(120,160,255,0.3);background:rgba(120,160,255,0.08);padding:10px 24px;border-radius:8px;font-weight:500;transition:all 0.2s;">Back to Home Portal</a>' +
              '</div>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          });
        })
    );
    return;
  }

  // Network-First strategy for local CSS & JS files to ensure latest styles load instantly
  if (url.origin === self.location.origin && (url.pathname.endsWith('.css') || url.pathname.endsWith('.js'))) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then(cache => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Caching filter to prevent bloat: Cache local assets and trusted CDNs
  const shouldCache = url.origin === self.location.origin || 
                      url.origin.includes('jsdelivr') ||
                      url.origin.includes('cloudflare') ||
                      url.origin.includes('unpkg') ||
                      url.origin.includes('googleapis') ||
                      url.origin.includes('gstatic');

  if (!shouldCache) {
    // If not cache-worthy (e.g. NOAA SWPC weather APIs, analytics), fetch directly from network
    event.respondWith(fetch(event.request));
    return;
  }

  // Handle local and CDN asset caching
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Fetch in background to update cache (Stale-While-Revalidate)
        fetch(event.request)
          .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(RUNTIME_CACHE).then(cache => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => { /* Ignore offline background fetch failure */ });
        return cachedResponse;
      }

      // If not in cache, fetch from network and cache dynamically
      return fetch(event.request)
        .then(networkResponse => {
          // Check if response is valid before caching
          if (!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== 'opaque')) {
            return networkResponse;
          }
          
          // Cache the fetched resource
          const responseToCache = networkResponse.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(err => {
          console.error('[Service Worker] Fetch failed offline:', err);
          // If offline and request is for HTML, return a fallback offline message
          if (event.request.headers.get('accept').includes('text/html')) {
            return new Response(
              '<div style="text-align:center;padding:50px;font-family:\'Inter\',sans-serif;background:#060814;color:#e8edff;height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;">' +
              '<h1 style="font-family:\'Outfit\',sans-serif;font-size:2.5rem;margin-bottom:10px;background:linear-gradient(135deg,#5aa6ff,#ffce4d);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Connection Offline</h1>' +
              '<p style="color:#8b97c4;max-width:400px;line-height:1.6;margin-bottom:24px;">You are currently offline. This science page has not been visited yet and is not stored locally.</p>' +
              '<a href="/" style="color:#e8edff;text-decoration:none;border:1px solid rgba(120,160,255,0.3);background:rgba(120,160,255,0.08);padding:10px 24px;border-radius:8px;font-weight:500;transition:all 0.2s;">Back to Home Portal</a>' +
              '</div>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          }
        });
    })
  );
});
