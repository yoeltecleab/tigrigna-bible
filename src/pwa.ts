import {registerSW} from 'virtual:pwa-register';

if (window.isSecureContext) {
    registerSW({
        immediate: true,
        onRegisteredSW(swUrl: string, registration: ServiceWorkerRegistration | undefined) {
            if (!registration) {
                return;
            }

            // Force a freshness check shortly after load so icon/manifest updates land quickly.
            window.setTimeout(() => {
                void registration.update();
            }, 2500);

            window.setInterval(() => {
                void registration.update();
            }, 60 * 60 * 1000);

            // If a waiting worker exists (new deploy), activate it without requiring a manual refresh.
            if (registration.waiting) {
                registration.waiting.postMessage({type: 'SKIP_WAITING'});
            }

            registration.addEventListener('updatefound', () => {
                const installing = registration.installing;
                if (!installing) {
                    return;
                }

                installing.addEventListener('statechange', () => {
                    if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                        // New content available — reload once so the installed PWA picks up new icons/manifest.
                        console.info('[PWA] Updated service worker from', swUrl);
                    }
                });
            });
        }
    });
} else {
    console.warn('[PWA] Service worker is disabled on insecure origin. Use HTTPS or localhost for offline support.');
}
