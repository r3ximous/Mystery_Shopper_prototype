// Service Worker for PWA offline capabilities
const CACHE_NAME = 'mystery-shopper-v1';
const STATIC_ASSETS = [
  '/',
  '/static/style.css',
  '/static/js/survey_main.js',
  '/static/js/survey_flow.js',
  '/static/js/survey_tts.js',
  '/static/js/survey_vad.js',
  '/static/js/survey_dom.js',
  '/static/js/survey_state.js',
  '/static/js/survey_config.js',
  '/static/js/survey_submit.js',
  '/admin'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then(response => {
            // Clone response for caching
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseClone);
                });
            }
            return response;
          })
          .catch(() => {
            // Offline fallback for pages
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/');
            }
          });
      })
  );
});

// Background sync for offline survey submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'survey-submission') {
    event.waitUntil(syncSurveySubmissions());
  }
});

async function syncSurveySubmissions() {
  const offlineSubmissions = await getOfflineSubmissions();
  
  for (const submission of offlineSubmissions) {
    try {
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission.data)
      });
      
      // Remove successful submission from offline storage
      await removeOfflineSubmission(submission.id);
    } catch (error) {
      console.log('Sync failed for submission:', submission.id);
    }
  }
}

async function getOfflineSubmissions() {
  // Implementation would use IndexedDB to store offline submissions
  return [];
}

async function removeOfflineSubmission(id) {
  // Implementation would remove from IndexedDB
}
