# wpr-world-cup-tracker

Live 2026 FIFA World Cup widget for **Wausau Pilot & Review** — a single-scroll
editorial page covering the tournament pulse, today's matches with broadcast info,
expandable box scores with formations and timelines, the full 104-match schedule,
all 12 group tables, the best-thirds qualification ledger, and stat leader boards
(Golden Boot, assists, saves, discipline). Embedded into the WPR WordPress site via
iframe from GitHub Pages.

Tournament window: **June 11 – July 19, 2026.**

## How this differs from the other WPR widgets

Every scraped widget (`wpr-gas-prices`, `marathon-meetings`, etc.) runs the standard
pipeline: **Python scraper → GitHub Actions cron → static JSON → React/Vite → Pages.**
That layer exists because those sources are scrape-fragile.

This one does **not** — same precedent as `wpr-brewers-tracker`. ESPN's soccer APIs are
public, stable, and CORS-open (`access-control-allow-origin: *`), so the widget fetches
them **directly in the browser** and re-polls every 60 seconds. No scraper, no cron, no
committed JSON. The only GitHub Action builds and deploys. This is deliberate — see
`CLAUDE.md` before changing it.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173/wpr-world-cup-tracker/
npm run build      # outputs to dist/
npm run preview    # serve the production build locally
```

## Deploy

Push to `main`. The `Deploy to GitHub Pages` workflow builds and publishes
automatically. In repo Settings → Pages, set the source to **GitHub Actions** once.

Live URL: `https://rowanflynnpilot.github.io/wpr-world-cup-tracker/`

## Embed

```html
<iframe src="https://rowanflynnpilot.github.io/wpr-world-cup-tracker/"
        style="width:100%;border:0;min-height:2400px" loading="lazy"
        title="The 2026 World Cup, by the numbers"></iframe>
```

## Configure

Everything tweakable lives in `src/config.js`: season, date range, hero team
(USMNT, ESPN id 660), timezone, poll interval, sponsor strings, and WPR brand assets.

## Trademark note

This widget displays facts (scores, standings, statistics) with team flags/logos
referenced from ESPN's CDN, not redrawn. "FIFA" and "World Cup" are FIFA trademarks;
the footer carries a non-affiliation line. As with the Brewers tool, confirm with WPR
before selling sponsorship directly against FIFA marks.

## If `.github/` or `.gitignore` went missing from the zip

Some Windows unzip tools strip dotfiles. If they're absent after extracting:
`.gitignore` should contain `node_modules`, `dist`, `.DS_Store`, `*.local`, `.vite`.
The workflow file is reproduced in `docs/deploy.yml.txt` as a backup.
