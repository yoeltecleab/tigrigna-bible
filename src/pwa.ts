import {registerSW} from 'virtual:pwa-register';

declare global {
    interface Window {
        __tbNeedRefresh?: () => void;
        __tbOffline?: boolean;
    }
}

const emitOfflineStatus = () => {
    window.__tbOffline = !navigator.onLine;
    window.dispatchEvent(new CustomEvent('tb-connectivity', {detail: {offline: !navigator.onLine}}));
};

window.addEventListener('online', emitOfflineStatus);
window.addEventListener('offline', emitOfflineStatus);
emitOfflineStatus();

if (window.isSecureContext) {
    const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
            window.__tbNeedRefresh = () => {
                void updateSW(true);
            };
            window.dispatchEvent(new CustomEvent('tb-sw-update'));
        },
        onOfflineReady() {
            console.info('[PWA] App shell ready for offline use');
        },
        onRegisteredSW(swUrl: string, registration: ServiceWorkerRegistration | undefined) {
            if (!registration) {
                return;
            }

            window.setTimeout(() => {
                void registration.update();
            }, 2500);

            window.setInterval(() => {
                void registration.update();
            }, 60 * 60 * 1000);

            console.info('[PWA] Registered', swUrl);
        }
    });
} else {
    console.warn('[PWA] Service worker is disabled on insecure origin. Use HTTPS or localhost for offline support.');
}
