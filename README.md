# Jam Radar — Live Dhaka Jam & Waterlogging Map

> **One-line pitch:** Live Dhaka jam & waterlogging map — see which roads are passable before you leave.

**Arohon "Build for Bangladesh" entry.** Submissions close 10 Dec 2026; top two entries win a GTA 6 copy.

## The problem

When it rains in Dhaka, roads flood knee-deep in hours and traffic gridlocks — but commuters have no way to know *which* roads are passable before they leave. Jam Radar fixes that with a live map built from rider reports: tap the map, report waterlogging or a jam in under 30 seconds, and everyone else can see it instantly.

## How to run

No build step, no backend, no account. Just serve the folder:

```bash
cd jam-radar
python3 -m http.server 8000
# then open http://localhost:8000
```

(Opening `index.html` directly also works for the page itself, but the seed data loads via `fetch`, so a local server is the reliable way.)

## Deploy

**Vercel (primary preview host)** — static site, no build step, no server functions. `vercel.json` at the repo root enables clean URLs and falls back unknown routes to `index.html`:

```bash
# From the repo root, with the Vercel CLI installed and logged in:
vercel --prod
# or: import the GitHub repo at vercel.com/new — no build command, no output directory needed.
```

**GitHub Pages (fallback)** — the same files work at a subpath too, because every local path is relative (`styles.css`, `app.js`, `data/seed.json` — no absolute `/asset` paths, no localhost-only assumptions):

- Repo Settings → Pages → Deploy from branch → pick the branch and `/` (root) folder.
- The site then lives at `https://<user>.github.io/jam-radar/` and all assets resolve under that subpath.

## Features

- **Live map** of Dhaka (Leaflet + OpenStreetMap), centred on Dhaka (23.8103, 90.4125)
- **Report in under 30 seconds:** tap the map (or "Report here"), pick waterlogging / jam, pick severity, optional note — the pin appears immediately. No login.
- **Severity colours:** waterlogging blue (light → medium → impassable), jam amber/red (slow → heavy → blocked)
- **3-hour expiry:** reports expire after 3 hours; each pin shows its age ("25 min ago")
- **Filters:** by type (all / waterlogging / jam), by area, by severity
- **Area summary:** each area shows Passable / Go slow / Avoid based on its worst live report
- **Bangla + English toggle** (default Bangla), mobile-first, big tap targets
- **Your reports persist** in your own browser via `localStorage`

## What is live vs seed

- **Live:** reports *you* submit. They are stored only in your browser (`localStorage`) and marked "Live report".
- **Seed / demo data:** 40 reports in `data/seed.json` for known waterlogging spots (Mirpur/Kazipara, Dhanmondi 27, Panthapath, Green Road, Mohammadpur, Kalshi, Uttara, Gulshan, Motijheel, Banani, and more). They are clearly labelled **"Seed / demo data"** in the UI and in popups, and marked as demo in this README. Seed timestamps are generated at load time from a minute-offset, so they always look fresh on first open and expire after 3 hours like real reports. Last verified: 25 Nov 2026.
- Seed data is never presented as live. Once real riders report, the seed is only there so the map is not empty on first open.

## Project structure

```
jam-radar/
├── index.html        # Page structure: header, summary, filters, map, area list, report sheet
├── styles.css        # Mobile-first styles, no framework
├── app.js            # All logic: map, seed + localStorage, expiry, filters, i18n, report flow
├── data/
│   └── seed.json     # 40 demo reports (area, type, severity, note, offsetMinutes)
└── README.md
```

## Tech

- Leaflet 1.9.4 + OpenStreetMap tiles (CDN)
- Plain HTML / CSS / JavaScript — no framework, no build step
- `localStorage` for the visitor's own reports; nothing leaves the browser
