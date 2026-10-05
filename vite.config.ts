import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react-swc';
import {VitePWA} from 'vite-plugin-pwa';

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
                'favicon.svg',
                'favicon-32.png',
                'apple-touch-icon.png',
                'icons/icon.svg',
                'icons/icon-192.png',
                'icons/icon-512.png',
                'icons/apple-touch-icon.png',
                'icons/favicon-32.png',
                'icons/favicon-16.png',
                'fonts/material-symbols.css',
                'fonts/material-symbols-outlined-subset.ttf',
                'og/og-image.png',
                'robots.txt',
                'sitemap.xml'
            ],
            manifest: {
                name: 'Tigrigna Bible',
                short_name: 'TigrignaBible',
                description: 'Offline-capable Tigrigna Bible reader and search experience.',
                theme_color: '#0b1727',
                background_color: '#0b1727',
                display: 'standalone',
                start_url: '/',
                lang: 'ti',
                dir: 'ltr',
                icons: [
                    {
                        src: '/icons/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/icons/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: '/icons/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    },
                    {
                        src: '/icons/icon.svg',
                        sizes: 'any',
                        type: 'image/svg+xml'
                    }
                ]
            },
            workbox: {
                maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true,
                navigateFallback: '/index.html',
                navigateFallbackDenylist: [/^\/content\//],
                // Precache app shell only — Bible JSON is runtime-cached on demand.
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
                globIgnores: ['**/content/**', '**/og/**'],
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
