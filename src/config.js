// Single source of truth. Change tournament facts, branding, and sponsor copy
// here and nowhere else.

export const SEASON = 2026
export const LEAGUE = 'fifa.world'

// The full tournament window, opener to final, as the ESPN dates= range.
// One scoreboard call returns all 104 matches.
export const DATE_RANGE = '20260611-20260719'

// Round structure, derived from the official 48-team format. Matches are
// labeled by chronological sequence, NOT by calendar date — kickoff timestamps
// are UTC and late matches spill across date boundaries.
export const ROUND_SLICES = [
  ['Group Stage', 72],
  ['Round of 32', 16],
  ['Round of 16', 8],
  ['Quarterfinals', 4],
  ['Semifinals', 2],
  ['Third Place', 1],
  ['Final', 1],
]
export const TOTAL_MATCHES = 104

// The hometown angle. ESPN team id 660 = United States. The pulse strip
// follows this team's next fixture; once they're out it follows the
// tournament's next fixture instead.
export const HERO_TEAM_ID = '660'

// Wausau reads in Central Time. All kickoff times render in this zone, always.
export const TZ = 'America/Chicago'
export const TZ_LABEL = 'CT'

// Live polling. One scoreboard GET + one standings GET per minute.
export const POLL_MS = 60_000

// How many names per leaders category.
export const LEADERS_PER_CATEGORY = 5

// WPR brand assets (the publication's own logo). Vendored into the bundle —
// same 640×82 wordmark the site masthead serves, but not hotlinked, so a WP
// media-library change can't break the widget.
import wprLogo from './assets/wpr-logo.png'
export const WPR_LOGO = wprLogo
export const WPR_TAGLINE = 'Where Locals Look First For News'

// Sellable sponsor surfaces. Swap the strings; the layout exposes one header
// slot plus two inline.
export const SPONSORS = {
  header: 'Your Sponsor Here',
  standings: 'Sponsor B',
  leaders: 'Sponsor C',
}
