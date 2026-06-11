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

// Leaders re-poll, deliberately slower: the boards move on goals, not on the
// clock. Also flips the pre-tournament "pending" state after the first whistle
// without a page reload.
export const LEADERS_POLL_MS = 300_000

// How many names per leaders category.
export const LEADERS_PER_CATEGORY = 5

// WPR brand assets (the publication's own logo and circular badge). Vendored
// into the bundle — same files the site serves, but not hotlinked, so a WP
// media-library change can't break the widget.
import wprLogo from './assets/wpr-logo.png'
import wprBadge from './assets/wpr-badge.png'
export const WPR_LOGO = wprLogo
export const WPR_BADGE = wprBadge

// Where the mini sends readers: the WPR page hosting the full tracker.
// A ?link= query param on the mini's URL overrides this.
export const TRACKER_PAGE_URL = 'https://wausaupilotandreview.com/world-cup-2026/'
export const WPR_TAGLINE = 'Where Locals Look First For News'

// Sellable sponsor surfaces: one masthead slot plus two inline. A slot renders
// only when its string is set — keep it null until the space is actually sold.
export const SPONSORS = {
  header: null,
  standings: null,
  leaders: null,
}
