// PWA Service Worker Registration & Offline support
if ('serviceWorker' in navigator && !window.location.host.includes('localhost:5173')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        // Log service worker registration success
        if (registration.installing) {
          console.debug('Service Worker installing');
        } else if (registration.waiting) {
          console.debug('Service Worker installed & waiting');
        } else if (registration.active) {
          console.debug('Service Worker active');
        }
      })
      .catch((error) => {
        console.warn('Service worker registration failed:', error);
      });
  });
}
