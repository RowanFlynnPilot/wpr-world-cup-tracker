# Handoff — wpr-world-cup-tracker

Setup checklist for getting this repo running locally and deployed. Written for
Windows / PowerShell 5.1 (chain with `;` not `&&`).

## Pre-flight

- Node 20+ (`node -v`)
- GitHub CLI authenticated (`gh auth status`)
- The zip extracted into the projects root

## 1. Extract and install

```powershell
cd C:\Users\rpfly\Projects
Expand-Archive -Path .\wpr-world-cup-tracker.zip -DestinationPath . -Force
cd .\wpr-world-cup-tracker
npm install
```

## 2. Run it locally

```powershell
npm run dev
```

Open `http://localhost:5173/wpr-world-cup-tracker/`. On day one you should see the
masthead, the pulse strip with the next USMNT fixture, today's slate with broadcast
chips, the full schedule, all 12 groups at zero, and the leaders boards in their
"opens with the first whistle" state. Click any match row to expand the match center.

## 3. Create the repo and push

```powershell
git init ; git add -A ; git commit -m "World Cup 2026 tracker - initial build"
git branch -M main
gh repo create wpr-world-cup-tracker --public --source=. --remote=origin --push
```

The repo name **must** be `wpr-world-cup-tracker` — it matches `base` in
`vite.config.js`.

## 4. One-time Pages setting

```powershell
gh repo view --web
```

Settings → Pages → Source → **GitHub Actions**. The deploy workflow already ran on
push; if it failed because Pages wasn't configured yet:

```powershell
gh run rerun --failed ; gh run watch
```

Live at `https://rowanflynnpilot.github.io/wpr-world-cup-tracker/` a minute later.

## 5. First Claude Code prompt

Paste this to start a session with full context:

> Read CLAUDE.md first. This is the WPR World Cup tracker — browser-direct ESPN
> fetches, no scraper, no cron (deliberate; the guardrails are in CLAUDE.md).
> Run `npm run dev` and confirm it loads, then I'll tell you what we're changing.

## Dev gotchas

- **Two fetches per mount in dev** — React 18 StrictMode. Expected. Production
  mounts once.
- **Leaders boards empty before June 11** — ESPN's 2026 leaders document 404s until
  a match has been played. The pending state is correct; don't "fix" it.
- **Formations missing until ~1 hour before kickoff** — lineups post late. The match
  center shows a note until rosters carry formation data.
- **All times are Central** — by design, hardcoded to `America/Chicago` in config.
- If the schedule fetch throws "expected 104 events", ESPN changed something —
  investigate the scoreboard response before touching the validation.

## Embedding in WordPress

The widget posts its content height to the parent page
(`{ type: 'wpr-world-cup-tracker:height', height }`) whenever the layout
changes. A fixed-height scrolling iframe works without it; to let the page
grow naturally instead, use this in the WP embed block:

```html
<iframe id="wpr-wc" src="https://rowanflynnpilot.github.io/wpr-world-cup-tracker/"
  style="width:100%;border:0;" height="900" title="2026 World Cup tracker"></iframe>
<script>
  window.addEventListener('message', function (e) {
    if (e.origin !== 'https://rowanflynnpilot.github.io') return;
    if (!e.data || e.data.type !== 'wpr-world-cup-tracker:height') return;
    document.getElementById('wpr-wc').style.height = e.data.height + 'px';
  });
</script>
```

The origin check means only the deployed widget can resize the frame.

## Sponsor slots

Three sellable surfaces, strings in `src/config.js` → `SPONSORS`:
`header` (masthead), `standings` (above the groups), `leaders` (above the boards).
