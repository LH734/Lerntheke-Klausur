// Service Worker: Alle Dateien werden beim ersten Besuch gespeichert. Danach läuft die
// Lerntheke auch ohne Netz. Antworten kommen sofort aus dem Speicher und werden im
// Hintergrund aktualisiert. Nach einer Änderung an dieser Liste VERSION erhöhen.

const VERSION = 'lerntheke-v1';

const FONTS = [
  'AMS-Regular', 'Caligraphic-Bold', 'Caligraphic-Regular', 'Fraktur-Bold', 'Fraktur-Regular',
  'Main-Bold', 'Main-BoldItalic', 'Main-Italic', 'Main-Regular', 'Math-BoldItalic', 'Math-Italic',
  'SansSerif-Bold', 'SansSerif-Italic', 'SansSerif-Regular', 'Script-Regular', 'Size1-Regular',
  'Size2-Regular', 'Size3-Regular', 'Size4-Regular', 'Typewriter-Regular',
].map((f) => `lib/katex/fonts/KaTeX_${f}.woff2`);

const DATEIEN = [
  './',
  'index.html',
  'aufgaben.json',
  'manifest.webmanifest',
  'css/app.css',
  'js/app.js',
  'js/config.js',
  'js/daten.js',
  'js/zahl.js',
  'js/klausur.js',
  'js/speicher.js',
  'js/abbildungen.js',
  'lib/katex/katex.min.css',
  'lib/katex/katex.min.js',
  'lib/katex/contrib/auto-render.min.js',
  'lib/qrcode/qrcode.js',
  'icons/icon.svg',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  ...FONTS,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(DATEIEN.map((d) => new Request(d, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== VERSION).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

function aktualisiere(cache, adresse, schluessel) {
  return fetch(adresse, { cache: 'no-cache' }).then((antwort) => {
    if (antwort && antwort.ok && antwort.type === 'basic') cache.put(schluessel, antwort.clone());
    return antwort;
  });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Prüfung auf neue Inhalte: immer aus dem Netz, Speicher dabei aktualisieren
  if (url.searchParams.has('frisch')) {
    event.respondWith(caches.open(VERSION).then((cache) => {
      const schluessel = new Request(url.pathname);
      return aktualisiere(cache, url.href, schluessel);
    }));
    return;
  }

  // Seitenaufrufe (auch mit ?lehrer=1) bekommen die gespeicherte Startseite
  const schluessel = request.mode === 'navigate' ? new Request(new URL('./', self.location).href) : new Request(url.origin + url.pathname);
  event.respondWith(caches.open(VERSION).then(async (cache) => {
    const gespeichert = await cache.match(schluessel, { ignoreSearch: true });
    const netz = aktualisiere(cache, url.href, schluessel).catch(() => null);
    if (gespeichert) {
      event.waitUntil(netz);
      return gespeichert;
    }
    const antwort = await netz;
    return antwort || new Response('Offline', { status: 503, statusText: 'Offline' });
  }));
});
