// Pure functions that shape API responses for the components. No fetching here.
import { ROUND_SLICES, TZ, TZ_LABEL, HERO_TEAM_ID } from '../config.js'

// ---- time ------------------------------------------------------------------

const timeFmt = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric', minute: '2-digit', timeZone: TZ,
})
const dateFmt = new Intl.DateTimeFormat('en-US', {
  weekday: 'short', month: 'short', day: 'numeric', timeZone: TZ,
})
const dayKeyFmt = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric', month: '2-digit', day: '2-digit', timeZone: TZ,
})

export const fmtKickoff = (iso) => `${timeFmt.format(new Date(iso))} ${TZ_LABEL}`
export const fmtDay = (iso) => dateFmt.format(new Date(iso))
export const dayKey = (iso) => dayKeyFmt.format(new Date(iso))
export const todayKey = () => dayKeyFmt.format(new Date())

// "Today" / "Tomorrow" (in Central Time) instead of a calendar date when the
// match is that close — reads warmer on the compact surfaces.
export function fmtDayRelative(iso) {
  const key = dayKey(iso)
  if (key === todayKey()) return 'Today'
  if (key === dayKeyFmt.format(new Date(Date.now() + 86_400_000))) return 'Tomorrow'
  return fmtDay(iso)
}

// ---- schedule --------------------------------------------------------------

// Label every match with its round by chronological sequence. Kickoff
// timestamps are UTC, so late local kickoffs cross date boundaries — sequence
// slicing is the one correct path. Input must already be date-sorted
// (fetchSchedule sorts).
export function labelRounds(events) {
  const byId = new Map()
  let cursor = 0
  for (const [round, count] of ROUND_SLICES) {
    for (const event of events.slice(cursor, cursor + count)) {
      byId.set(event.id, round)
    }
    cursor += count
  }
  return byId
}

export const competitorsOf = (event) => event.competitions[0].competitors
export const homeOf = (event) => competitorsOf(event).find((c) => c.homeAway === 'home')
export const awayOf = (event) => competitorsOf(event).find((c) => c.homeAway === 'away')
export const isLive = (event) => event.status.type.state === 'in'
export const isDone = (event) => event.status.type.completed

export function broadcastsOf(event) {
  const names = (event.competitions[0].broadcasts ?? []).flatMap((b) => b.names ?? [])
  return [...new Set(names)]
}

export function venueOf(event) {
  const v = event.competitions[0].venue
  if (!v) return null
  return { name: v.fullName, city: v.address?.city ?? '' }
}

// Group matches by Central-Time calendar day, preserving order.
export function groupByDay(events) {
  const days = new Map()
  for (const event of events) {
    const key = dayKey(event.date)
    if (!days.has(key)) days.set(key, [])
    days.get(key).push(event)
  }
  return days
}

// Today's slate, or the next day that has matches once today's are gone.
export function currentSlate(events) {
  const today = todayKey()
  const todays = events.filter((e) => dayKey(e.date) === today)
  if (todays.length > 0) return { label: 'Today at the Cup', events: todays }
  const upcoming = events.filter((e) => !isDone(e) && dayKey(e.date) > today)
  if (upcoming.length === 0) return { label: 'Final whistle', events: [] }
  const nextDay = dayKey(upcoming[0].date)
  return {
    label: `Next up — ${fmtDay(upcoming[0].date)}`,
    events: upcoming.filter((e) => dayKey(e.date) === nextDay),
  }
}

// ---- standings -------------------------------------------------------------

export const statOf = (entry, name) =>
  entry.stats.find((s) => s.name === name)

export const statVal = (entry, name) => Number(statOf(entry, name)?.value ?? 0)
export const statDisplay = (entry, name) => statOf(entry, name)?.displayValue ?? '0'

// Team id → identity + group letter, built once from standings. Powers group
// labels on match rows and team names in the leaders board.
export function buildTeamMap(groups) {
  const map = new Map()
  for (const group of groups) {
    const letter = group.name.replace('Group ', '')
    for (const entry of group.standings.entries) {
      map.set(String(entry.team.id), {
        name: entry.team.shortDisplayName ?? entry.team.displayName,
        abbrev: entry.team.abbreviation,
        logo: entry.team.logos?.[0]?.href,
        group: letter,
      })
    }
  }
  return map
}

export function groupOf(event, teamMap) {
  for (const c of competitorsOf(event)) {
    const team = teamMap.get(String(c.team.id))
    if (team?.group) return team.group
  }
  return null
}

// The eight best third-placed teams advance. Ranked by the published criteria
// visible in the table: points, then goal difference, then goals for. (FIFA's
// further tiebreakers — disciplinary points, drawing of lots — are not
// computable from standings data; see CLAUDE.md.)
export function bestThirds(groups) {
  return groups
    .map((group) => {
      const entry = group.standings.entries.find((e) => statVal(e, 'rank') === 3)
      return entry ? { group: group.name.replace('Group ', ''), entry } : null
    })
    .filter(Boolean)
    .sort((a, b) =>
      statVal(b.entry, 'points') - statVal(a.entry, 'points') ||
      statVal(b.entry, 'pointDifferential') - statVal(a.entry, 'pointDifferential') ||
      statVal(b.entry, 'pointsFor') - statVal(a.entry, 'pointsFor'),
    )
}

// What a compact surface should feature, in order: the marquee match — live
// (the hero team's first), else the next kickoff, else, once the tournament
// is over, the final as a finished scoreline — plus the hero team's live or
// next match when that's a different game. One entry when the hero team is
// itself the marquee (or is out).
export function featuredMatches(events) {
  const heroIn = (e) =>
    competitorsOf(e).some((c) => String(c.team.id) === HERO_TEAM_ID)
  const live = events.filter(isLive)
  const upcoming = events.filter((e) => !isDone(e) && !isLive(e))
  const marquee = live.find(heroIn) ?? live[0] ?? upcoming[0] ?? events.at(-1) ?? null
  if (!marquee) return []
  const hero = live.find(heroIn) ?? upcoming.find(heroIn) ?? null
  return hero && hero !== marquee ? [marquee, hero] : [marquee]
}

// ---- featured players --------------------------------------------------------
// The honest "star" pick: the team's tournament goals leader, falling back to
// assists, then saves — only stats actually earned (value > 0). Null until the
// team has produced one; the per-team leaders doc 404s before a team's first
// match, same doctrine as the overall boards.
const FEATURE_CATEGORIES = [
  ['goals', 'goal'],
  ['assists', 'assist'],
  ['saves', 'save'],
]
export function featuredFromLeaders(doc) {
  if (!doc?.categories) return null
  const byName = new Map(doc.categories.map((c) => [c.name, c]))
  for (const [name, unit] of FEATURE_CATEGORIES) {
    const top = byName.get(name)?.leaders?.[0]
    const value = Number(top?.value ?? top?.displayValue ?? 0)
    if (top?.athlete?.$ref && value > 0) {
      return { athleteRef: top.athlete.$ref, value, unit: value === 1 ? unit : `${unit}s` }
    }
  }
  return null
}

// For a completed match: the top performer, derived from the summary's
// per-player box score — most goals, then assists, then shots on target.
// ESPN's feed carries no official player-of-the-match award, so this is
// computed and labeled as such. Null when nobody registered any of the
// three (and before the summary has player stats at all).
export function topPerformer(summary) {
  const stat = (p, name) => Number(p.stats?.find((s) => s.name === name)?.value ?? 0)
  let best = null
  for (const side of summary.rosters ?? []) {
    for (const p of side.roster ?? []) {
      const cand = {
        goals: stat(p, 'totalGoals'),
        assists: stat(p, 'goalAssists'),
        sot: stat(p, 'shotsOnTarget'),
        athlete: p.athlete,
        team: side.team,
      }
      if (cand.goals + cand.assists + cand.sot === 0) continue
      if (!best ||
          cand.goals > best.goals ||
          (cand.goals === best.goals && cand.assists > best.assists) ||
          (cand.goals === best.goals && cand.assists === best.assists && cand.sot > best.sot)) {
        best = cand
      }
    }
  }
  if (!best) return null
  const parts = []
  if (best.goals > 0) parts.push(`${best.goals} ${best.goals === 1 ? 'goal' : 'goals'}`)
  if (best.assists > 0) parts.push(`${best.assists} ${best.assists === 1 ? 'assist' : 'assists'}`)
  if (parts.length === 0) parts.push(`${best.sot} on target`)
  return {
    name: best.athlete?.shortName ?? best.athlete?.displayName ?? '',
    headshot: best.athlete?.headshot?.href ?? null,
    teamAbbrev: best.team?.abbreviation ?? '',
    statLine: parts.join(', '),
  }
}

// ---- pulse -----------------------------------------------------------------

export function pulse(events) {
  const done = events.filter(isDone)
  const goals = done.reduce(
    (sum, e) => sum + competitorsOf(e).reduce((s, c) => s + Number(c.score ?? 0), 0),
    0,
  )
  // "Next" means not yet kicked off — matches in play already surface in the
  // live counter and today's slate, and would otherwise show here with a
  // stale kickoff time.
  const upcoming = events.filter((e) => !isDone(e) && !isLive(e))
  const next =
    upcoming.find((e) => competitorsOf(e).some((c) => String(c.team.id) === HERO_TEAM_ID)) ??
    upcoming[0] ??
    null
  return {
    played: done.length,
    goals,
    perMatch: done.length > 0 ? (goals / done.length).toFixed(2) : '—',
    live: events.filter(isLive),
    next,
    nextIsHero:
      next != null &&
      competitorsOf(next).some((c) => String(c.team.id) === HERO_TEAM_ID),
  }
}
