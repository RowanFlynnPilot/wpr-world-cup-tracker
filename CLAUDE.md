# wpr-world-cup-tracker — Claude Code context

Read this first. Persistent context for working in this repo.

## What this is

A live 2026 FIFA World Cup widget for **Wausau Pilot & Review** (WPR). Single-scroll,
editorial page: tournament pulse → today's slate (broadcast-forward) → expandable match
center (box score, formations, timeline) → full schedule by round → all 12 group tables →
best-thirds ledger → stat leader boards. Wrapped in WPR's masthead + tagline, teal accent.
Embedded into the WPR WordPress site via iframe from GitHub Pages.

Tournament window: **June 11 – July 19, 2026**, 104 matches, 48 teams, 12 groups (A–L).
USA / Canada / Mexico hosts. The hometown angle is the USMNT (`HERO_TEAM_ID = '660'`).

## CRITICAL: this repo intentionally breaks the standard WPR pattern

Other WPR widgets run: Python scraper → GitHub Actions cron → static JSON → React/Vite →
Pages. **Do NOT add that here.** ESPN's soccer APIs are public and CORS-open
(`access-control-allow-origin: *` — verified by inspecting response headers), so the
browser fetches them directly. No scraper, no cron, no committed JSON. The only workflow
builds and deploys.

If a future task seems to call for "caching the data" or "adding a scraper for
reliability" — don't. Same precedent as `wpr-brewers-tracker`. Client-side is the whole
point: simplest path, one source of truth, nothing to keep in sync, and the data is live
the second ESPN updates it.

## Architecture

```
ESPN soccer APIs → fetch() in browser → React/Vite → GitHub Pages → WP iframe
```

- `src/api.js` — the only place that talks to the network. Fail fast: non-200 throws,
  the caller renders its error state. One deliberate exception documented below (leaders).
- `src/config.js` — single source of truth: season, league, date range, round slices,
  hero team, timezone, poll interval, sponsors, brand assets.
- `src/lib/derive.js` — pure functions shaping API responses. No fetching here.
- `src/components/` — one component per concern. App.jsx owns load + 60s poll +
  the single `selectedId` for the match center.
- `src/theme.js` / `src/styles.css` — WPR editorial palette (teal #3A867C accent),
  Fraunces + Public Sans (matches Follow the Money / Brewers design system).
- `src/main.jsx` — mounts the app; when iframed, posts content height to the
  parent (`wpr-world-cup-tracker:height`) so the WP embed can resize without an
  inner scrollbar (listener snippet in docs/HANDOFF.md). Inert when nothing listens.
- `mini.html` / `src/mini.jsx` — second build entry: a sidebar embed with the
  marquee match (live, else next kickoff) plus the USMNT's next game when
  that's a different match (`featuredMatches()` in derive.js). Scoreboard
  fetch only, no standings. Posts height as `wpr-world-cup-tracker:mini-height`
  so both embeds can share a page.

## Verified ESPN endpoints (all CORS-open, all hit live during the build)

```
Scoreboard (all 104 matches, one call — scores, status, venues, broadcasts):
https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=200

Standings (12 group children; stats: gamesPlayed, wins, ties, losses, pointsFor,
pointsAgainst, pointDifferential, points, rank):
https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings?season=2026

Match summary (rosters w/ formation + formationPlace, boxscore team stats,
keyEvents timeline, shootout data):
https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event={id}

Stat leaders (core API — goals, assists, saves, yellowCards, ...; entries are
$ref links to athlete docs):
https://sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world/seasons/2026/types/1/leaders?lang=en&region=us

Per-team leaders (same shape, one team — powers the OnesToWatch featured
players; shape verified against the completed 2022 season, teams/202):
https://sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world/seasons/2026/types/1/teams/{id}/leaders?lang=en&region=us
```

Shapes verified against the live 2026 feed and, for completed-match structures
(timeline, shootouts, formations), against the 2022 final (event 633850,
ARG 3(4)–(2)3 FRA).

## Gotchas that look like bugs but aren't

- **Leaders 404 before the first whistle.** The 2026 leaders document does not exist
  until at least one match has been played ("No stats found"). `fetchLeaders()` returns
  `null` on 404 *only* and the Leaders component renders its pending state. This is the
  legitimate pre-tournament domain state, not a failure — do NOT add fallback data,
  sample players, or a retry loop. Every other status still throws.
- **Round labels come from sequence, not dates.** Kickoffs are UTC; late local matches
  spill across calendar-day boundaries, so date-based round detection mislabels matches.
  `labelRounds()` slices the date-sorted schedule by `ROUND_SLICES`
  (72/16/8/4/2/1/1 = 104). If ESPN ever returns ≠104 events, `fetchSchedule` throws —
  that's correct, investigate rather than soften the check.
- **React 18 StrictMode double-fires effects in dev only.** Two fetches per mount under
  `npm run dev` is expected. Do not "fix" it; production mounts once.
- **Best-thirds tiebreakers are partial by design.** Ranked by points → goal difference →
  goals for, which is what the standings expose. FIFA's further criteria (disciplinary
  points, drawing of lots) are not computable from this data. The component says so in
  its legend. Don't fake the rest.
- **Lineups land ~1 hour before kickoff.** Before that, summary rosters have no
  formation/starters; MatchCenter gates the pitch and shows the posting note. Not a bug.
- **Featured players appear as stats accrue.** Per-team leaders 404 until that
  team has played; OnesToWatch renders nothing until then (and picks goals →
  assists → saves, only values > 0). Headshot coverage is thin for smaller
  nations (Jordan/Uzbekistan: zero) — the monogram circle is the designed
  fallback, not a missing image.
- **Stat bars match by `team.id`, not array order.** ESPN's boxscore team order is not
  guaranteed to match the competitors array. Keep it keyed.
- **Shootout scores** live on `competitor.shootoutScore` and render as `Math.trunc`
  values in parentheses next to the 90/120-minute score.

## Conventions

- Repo name must stay `wpr-world-cup-tracker` — it matches `base` in `vite.config.js`.
  Rename one, rename both.
- All kickoff times render in `America/Chicago` ("CT"), always. Wausau reads in Central.
- No new dependencies without a reason that survives "could plain JS do this?"
  The formation pitch is hand-rolled SVG on purpose — no charting library.
- One correct path, no fallbacks. Fail loud. Surgical changes. Single responsibility
  per function. (House rules — same as every WPR repo.)

## Owner

Rowan (GitHub `rowanflynnpilot`), Windows, project root `C:\Users\rpfly\Projects`,
PowerShell 5.1 — chain commands with `;` not `&&`.
