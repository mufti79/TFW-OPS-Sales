// Service Worker for Progressive Web App
// Implements caching strategies to reduce memory usage and improve performance

const CACHE_NAME = 'tfw-ops-sales-v2';
const RUNTIME_CACHE = 'tfw-runtime-cache-v2';

// Resources to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - implement network-first strategy for dynamic content
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // For API calls and Firebase, use network-first strategy
  // Use hostname check to prevent URL manipulation attacks
  const url = new URL(event.request.url);
  const isApiCall = url.pathname.includes('/api/');
  // Check for all Firebase-related domains with specific patterns to avoid matching malicious domains
  // Only match exact Firebase subdomains to prevent security issues
  const isFirebaseCall = url.hostname.endsWith('.firebaseio.com') || 
                        url.hostname === 'firebaseio.com' ||
                        url.hostname.endsWith('.firebaseapp.com') ||
                        url.hostname === 'firebaseapp.com' ||
                        url.hostname.endsWith('.firebasestorage.googleapis.com') ||
                        url.hostname === 'firebasestorage.googleapis.com' ||
                        url.hostname.endsWith('.cloudfunctions.net');
  
  if (isApiCall || isFirebaseCall) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          // If network fails, try to return cached version
          return caches.match(event.request);
        })
    );
    return;
  }

  // For static assets, use cache-first strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Don't cache if not a valid response
        if (!response || response.status !== 200) {
          return response;
        }

        const responseToCache = response.clone();
        
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Handle memory pressure - clear runtime cache if needed
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(RUNTIME_CACHE)
        .then(() => {
          console.log('Service Worker: Runtime cache cleared');
          return self.clients.matchAll();
        })
        .then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'CACHE_CLEARED' });
          });
        })
    );
  }
});
