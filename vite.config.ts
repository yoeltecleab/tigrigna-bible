import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react-swc';
import {VitePWA} from 'vite-plugin-pwa';

const ICON_VERSION = 'v3';

export default defineConfig({
    server: {
        host: true,
        port: 5173,
        strictPort: true,
        allowedHosts: true
    },
    preview: {
        host: true,
        port: 4173,
        strictPort: true,
        allowedHosts: true
    },
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: [
                'favicon.ico',
                'favicon-32.png',
                'apple-touch-icon.png',
                `icons/apple-touch-icon-${ICON_VERSION}.png`,
                `icons/favicon-16-${ICON_VERSION}.png`,
                `icons/favicon-32-${ICON_VERSION}.png`,
                `icons/icon-192-${ICON_VERSION}.png`,
                `icons/icon-512-${ICON_VERSION}.png`,
                `icons/icon-192-maskable-${ICON_VERSION}.png`,
                `icons/icon-512-maskable-${ICON_VERSION}.png`,
                'fonts/material-symbols.css',
                'fonts/material-symbols-outlined-subset.ttf',
                'og/og-image.png',
                'robots.txt',
                'sitemap.xml'
            ],
            manifest: {
                id: '/',
                name: 'Tigrigna Bible',
                short_name: 'Tigrigna',
                description: 'Offline-capable Tigrigna Bible reader and search experience.',
                theme_color: '#3b2416',
                background_color: '#ffffff',
                display: 'standalone',
                orientation: 'any',
                start_url: '/',
                scope: '/',
                lang: 'ti',
                dir: 'ltr',
                icons: [
                    {
                        src: `/icons/icon-192-${ICON_VERSION}.png`,
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: `/icons/icon-512-${ICON_VERSION}.png`,
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: `/icons/icon-192-maskable-${ICON_VERSION}.png`,
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable'
                    },
                    {
                        src: `/icons/icon-512-maskable-${ICON_VERSION}.png`,
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ]
            },
            workbox: {
                maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true,
                navigateFallback: '/index.html',
                navigateFallbackDenylist: [
                    /^\/content\//,
                    /^\/icons\//,
                    /^\/fonts\//,
                    /^\/og\//,
                    /^\/assets\//,
                    /^\/favicon\.ico$/,
                    /^\/apple-touch-icon\.png$/,
                    /^\/manifest\.webmanifest$/,
                    /^\/sw\.js$/,
                    /^\/robots\.txt$/,
                    /^\/sitemap\.xml$/
                ],
                // App shell only — do not precache Bible JSON.
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,ttf,woff2}'],
                globIgnores: ['**/content/**', '**/og/**', '**/icons/logo-source.png'],
                runtimeCaching: [
                    {
                        urlPattern: ({request}) => request.destination === 'document',
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'pages-cache'
                        }
                    },
                    {
                        urlPattern: ({url}) => url.pathname.startsWith('/content/'),
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'bible-content-cache',
                            expiration: {
                                maxEntries: 2000,
                                maxAgeSeconds: 60 * 60 * 24 * 365
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: ({request, url}) =>
                            request.destination === 'image' ||
                            url.pathname.startsWith('/icons/') ||
                            url.pathname === '/apple-touch-icon.png' ||
                            url.pathname === '/favicon.ico',
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'app-icons-cache',
                            expiration: {
                                maxEntries: 64,
                                maxAgeSeconds: 60 * 60 * 24 * 30
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: ({request}) => request.destination === 'font',
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'app-fonts-cache',
                            expiration: {
                                maxEntries: 32,
                                maxAgeSeconds: 60 * 60 * 24 * 365
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    }
                ]
            }
        })
    ]
});
