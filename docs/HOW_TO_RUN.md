# How To Run & Deploy

## Laptop (development)

```bash
npm install
npm run generate:data
npm run dev
```

Open the URL shown by Vite (usually `http://localhost:5173`).

## Production preview

```bash
npm run build
npm run preview
```

## Deploy on Vercel

```bash
# First time (creates project + production deploy)
npx vercel --prod
```

Or connect the GitHub repo in the Vercel dashboard. Required project settings are already in `vercel.json`.

### After deploy

1. Set `VITE_SITE_URL` to your production URL (custom domain preferred).
2. Redeploy so share links and SEO meta pick up the URL.
3. In Vercel → Domains, add your custom domain (DNS as instructed).
4. Update `public/robots.txt`, `public/sitemap.xml`, and `index.html` OG/canonical tags to match the custom domain.

## Install as app (phones)

1. Open the HTTPS production URL.
2. Android Chrome: Install app / Add to Home screen.
3. iPhone Safari: Share → Add to Home Screen.
4. Open once online so offline caching can warm up.

## Why local LAN IP is not enough on iPhone

`http://<laptop-ip>:5173` is not a secure origin, so service workers (and reliable offline) will not work there. Use the Vercel HTTPS URL for install/offline testing.
