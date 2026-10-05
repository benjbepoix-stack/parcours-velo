/* Service worker : l'interface fonctionne hors ligne (favoris, GPX) ; itinéraires, météo et
   fonds de carte restent en ligne (tuiles déjà vues servies depuis le cache si possible). */
const VERSION = 'pv-v18';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'vendor/leaflet/leaflet.js', 'vendor/leaflet/leaflet.css', 'vendor/leaflet/images/layers.png', 'vendor/leaflet/images/layers-2x.png',
  'js/app.js', 'js/core/ride.js', 'js/core/planner.js', 'js/core/trip.js', 'js/core/dates.js',
  'js/services/routing.js', 'js/services/road-profile.js', 'js/services/wind.js', 'js/services/geocode.js', 'js/services/store.js', 'js/services/carnet-sync.js', 'js/services/carnet-metrics.js',
  'js/ui/icons.js', 'js/ui/charts.js', 'js/ui/map.js', 'js/ui/cols.js', 'js/ui/races.js', 'js/data/cols.js', 'js/data/races.js',
  'fonts/barlow-400.woff2', 'fonts/barlow-600.woff2', 'fonts/barlow-700.woff2', 'fonts/barlow-condensed-700-italic.woff2', 'fonts/barlow-condensed-800-italic.woff2', 'icons/icon.svg', 'icons/icon-192.png'
];
const TILES = 'pv-tiles-2'; // nouveau nom : purge les anciennes tuiles CARTO « API KEY REQUIRED »
const TILE_HOSTS = /arcgisonline|tile-cyclosm|tile\.openstreetmap|opentopomap|waymarkedtrails/;
const MAX_TILES = 600;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== TILES).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

async function trimTiles(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_TILES; i++) await cache.delete(keys[i]);
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Application : réseau d'abord (mises à jour immédiates), cache en secours.
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) caches.open(VERSION).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(e.request).then(hit => hit || caches.match('index.html')))
    );
    return;
  }
  // Tuiles de carte : cache d'abord, borné.
  if (TILE_HOSTS.test(url.hostname)) {
    e.respondWith(
      caches.open(TILES).then(async cache => {
        const hit = await cache.match(e.request);
        if (hit) return hit;
        const res = await fetch(e.request);
        if (res.ok || res.type === 'opaque') {
          cache.put(e.request, res.clone());
          trimTiles(cache);
        }
        return res;
      })
    );
  }
});
