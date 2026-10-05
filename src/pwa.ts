import {registerSW} from 'virtual:pwa-register';

if (window.isSecureContext) {
    registerSW({
        immediate: true,
        onRegisteredSW(_swUrl: string, registration: ServiceWorkerRegistration | undefined) {
            if (registration) {
                setInterval(() => {
                    registration.update();
                }, 60 * 60 * 1000);
            }
        }
    });
} else {
    // iOS and other browsers require HTTPS (or localhost) to enable service workers.
    console.warn('[PWA] Service worker is disabled on insecure origin. Use HTTPS or localhost for offline support.');
}
