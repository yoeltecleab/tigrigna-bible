# Tigrigna Bible PWA

Offline-capable Tigrigna Bible reader with search, bookmarks, and installable Progressive Web App support.

## Tech Stack

- React + TypeScript + Vite
- PWA via `vite-plugin-pwa`
- Zustand for persisted app state
- Static content from `public/content`
- Self-hosted fonts (`@fontsource` / `material-symbols`)
- Vercel Analytics + Speed Insights

## Project Structure

- `src/` web application code
- `src/data/api.ts` bible data access/search helpers
- `src/store/` persisted settings and saved verses
- `public/content/` bible datasets by language (currently `ti`)
- `scripts/generate-web-content.mjs` generates search/book indexes
- `vercel.json` SPA rewrites and cache headers for Vercel

## Run Locally

```bash
npm install
npm run generate:data
npm run dev
```

## Production Build

```bash
npm run generate:data
npm run build
npm run preview
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Framework preset: **Vite** (already set in `vercel.json`).
4. Build command: `npm run build` · Output: `dist`.
5. Optional env var: `VITE_SITE_URL=https://your-domain.com` (used for share links / SEO canonical base).
6. After first deploy, attach a custom domain in Vercel → Project → Settings → Domains.
7. Update `public/robots.txt`, `public/sitemap.xml`, and `index.html` canonical/OG URLs to your custom domain.

Deep links (`/reader/...`, `/search`, etc.) are handled by the SPA rewrite in `vercel.json`.

## iOS Offline Notes

1. Open the deployed `https://` URL, then Add to Home Screen.
2. Launch the installed app once while online so the service worker can cache the shell and visited content.
3. Chapter JSON is cached on demand (not fully precached) to keep install size small.

## Legal

See in-app **About** (`/about`) for scripture attribution notes and **Privacy** (`/privacy`) for the privacy policy. Confirm translation rights before a public launch.

## Add Another Language

1. Create `public/content/en/`
2. Add `oldtestibooks.json`, `newtestibooks.json`, and `book/*.json`
3. Run `npm run generate:data`
4. Extend language options in `src/store/settingsStore.ts` and `src/pages/SettingsPage.tsx`
