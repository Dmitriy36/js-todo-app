/*
 * SERVICE WORKER — Part of PWA (Progressive Web App) setup.
 * This file makes the app installable on phone home screens.
 * It currently does nothing except exist, which is enough to
 * enable installation.
 *
 * TO REMOVE THE PWA FEATURE ENTIRELY:
 * 1. Delete this file (sw.js)
 * 2. Delete manifest.json
 * 3. Remove the <link rel="manifest"> line from index.html
 * 4. Remove the service worker registration block from app.js
 * That's it — the app will work exactly as before.
 *
 * TO DISABLE SERVICE WORKER DURING DEBUGGING:
 * Open DevTools → Application → Service Workers → check "Bypass for network"
 * This makes the browser ignore the service worker without deleting anything.
 */

const CACHE_NAME = "todo-app-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  self.clients.claim();
});
