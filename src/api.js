// ESPN API client. One job: fetch and return JSON. No fallbacks, no caching
// layer. Both hosts are public and CORS-open (access-control-allow-origin: *),
// so this runs in the browser.
//
// Verified against live data on 2026-06-10:
//   scoreboard  → all 104 matches w/ status, scores, venues, broadcasts
//   standings   → 12 groups w/ W/D/L/GF/GA/GD/Pts
//   summary     → formations + lineups (formationPlace), box score, keyEvents
//   leaders     → tournament goals/assists/saves/cards (core API, $ref-linked)
import { SEASON, LEAGUE, DATE_RANGE, LEADERS_PER_CATEGORY, TOTAL_MATCHES } from './config.js'

const SITE = `https://site.api.espn.com/apis/site/v2/sports/soccer/${LEAGUE}`
const SITE_V2 = `https://site.api.espn.com/apis/v2/sports/soccer/${LEAGUE}`
const CORE = `https://sports.core.api.espn.com/v2/sports/soccer/leagues/${LEAGUE}`

// Fail fast: a bad response throws, the calling component shows its error state.
async function getJSON(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`ESPN API ${res.status} for ${url}`)
  return res.json()
}

// Every match in the tournament, opener to final, in one call. Round labels
// are sliced by sequence (labelRounds), so a short or long feed would mislabel
// every round downstream — anything other than the full 104 throws.
export async function fetchSchedule() {
  const data = await getJSON(`${SITE}/scoreboard?dates=${DATE_RANGE}&limit=200`)
  const count = Array.isArray(data.events) ? data.events.length : 0
  if (count !== TOTAL_MATCHES) {
    throw new Error(`Scoreboard returned ${count} events, expected ${TOTAL_MATCHES}`)
  }
  return [...data.events].sort((a, b) => new Date(a.date) - new Date(b.date))
}

// All 12 group tables.
export async function fetchStandings() {
  const data = await getJSON(`${SITE_V2}/standings?season=${SEASON}`)
  if (!Array.isArray(data.children) || data.children.length !== 12) {
    throw new Error('Standings did not return 12 groups')
  }
  return data.children
}

// Deep data for one match: rosters/formations, box score, key events, header.
export function fetchMatchSummary(eventId) {
  return getJSON(`${SITE}/summary?event=${eventId}`)
}

// Tournament stat leaders. The document 404s until the first match has been
// played — that is a legitimate pre-tournament state, not a failure, so it
// returns null and the Leaders component renders its "no stats yet" state.
// Any other non-200 still throws.
export async function fetchLeaders() {
  const res = await fetch(`${CORE}/seasons/${SEASON}/types/1/leaders?lang=en&region=us`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`ESPN core API ${res.status} for leaders`)
  return res.json()
}

// Leader entries reference athletes by $ref. Hydrate the top N per category
// in parallel; team identity comes from the team $ref id via the standings
// team map, costing zero extra requests.
export async function hydrateAthletes(refs) {
  const unique = [...new Set(refs)]
  const docs = await Promise.all(
    unique.map((ref) => getJSON(`${ref.replace('http://', 'https://')}?lang=en&region=us`)),
  )
  return new Map(unique.map((ref, i) => [ref, docs[i]]))
}

export { LEADERS_PER_CATEGORY }
