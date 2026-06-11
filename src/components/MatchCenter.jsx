import { useEffect, useRef, useState } from 'react'
import { fetchMatchSummary } from '../api.js'
import { POLL_MS } from '../config.js'
import {
  fmtDay, fmtKickoff, awayOf, homeOf, broadcastsOf, venueOf, isLive, isDone,
} from '../lib/derive.js'
import FormationPitch from './FormationPitch.jsx'
import Flag from './Flag.jsx'
import OnesToWatch from './OnesToWatch.jsx'
import TopPerformer from './TopPerformer.jsx'

// Stats shown in the team comparison, in display order. Names match ESPN's
// boxscore statistics names exactly.
const STAT_ROWS = [
  ['possessionPct', 'Possession %'],
  ['totalShots', 'Shots'],
  ['shotsOnTarget', 'On target'],
  ['wonCorners', 'Corners'],
  ['foulsCommitted', 'Fouls'],
  ['offsides', 'Offsides'],
  ['saves', 'Saves'],
]

// Timeline events worth printing, with the chip each gets.
const TIMELINE_CHIPS = new Map([
  ['Goal', { label: 'GOAL', cls: 'chip-goal' }],
  ['Own Goal', { label: 'OG', cls: 'chip-goal' }],
  ['Penalty - Scored', { label: 'PEN', cls: 'chip-goal' }],
  ['Penalty - Missed', { label: 'PEN ✕', cls: 'chip-card' }],
  ['Yellow Card', { label: 'YC', cls: 'chip-yellow' }],
  ['Red Card', { label: 'RC', cls: 'chip-red' }],
  ['Substitution', { label: 'SUB', cls: 'chip-sub' }],
])

export default function MatchCenter({ event, roundOf, teamMap, onClose }) {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState(null)
  const live = isLive(event)

  // The summary loads once for future and finished matches, and re-polls on
  // the scoreboard cadence while the match is live so the stats and timeline
  // keep pace with the polled scoreline. A failed re-poll keeps the last good
  // summary; only a failed first load surfaces the error state.
  useEffect(() => {
    let cancelled = false
    let loaded = false
    async function load() {
      try {
        const data = await fetchMatchSummary(event.id)
        if (cancelled) return
        loaded = true
        setSummary(data)
        setError(null)
      } catch (err) {
        if (!cancelled && !loaded) setError(err.message)
      }
    }
    load()
    if (!live) return () => { cancelled = true }
    const timer = setInterval(load, POLL_MS)
    return () => { cancelled = true; clearInterval(timer) }
  }, [event.id, live])

  // The panel renders above the schedule, so a click deep in the 104-match
  // list would otherwise appear to do nothing. App keys this component by
  // match id, so the mount effect runs once per selection. Two deliberate
  // choices: no scroll at all when the panel is already on screen (opening
  // from a Today card), and an instant jump rather than a smooth animation —
  // a smooth scroll gets retargeted by the summary growing the panel and,
  // in the resized iframe embed, fights the parent page's reflow, which
  // reads as violent shaking.
  const sectionRef = useRef(null)
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) return
    el.scrollIntoView({ block: 'nearest' })
  }, [])

  const home = homeOf(event)
  const away = awayOf(event)
  const venue = venueOf(event)
  const tv = broadcastsOf(event)
  const started = live || isDone(event)

  return (
    <section ref={sectionRef} className="match-center" aria-label="Match center">
      <div className="mc-head">
        <span className="mc-round">{roundOf.get(event.id)}</span>
        <button className="mc-close" onClick={onClose}>Close</button>
      </div>

      <div className="mc-scoreline">
        <ScoreTeam competitor={away} />
        <div className="mc-score">
          {started ? (
            <>
              <span className="mc-score-num">
                {away.score}
                {away.shootoutScore != null && <small> ({Math.trunc(away.shootoutScore)})</small>}
              </span>
              <span className="mc-score-sep">–</span>
              <span className="mc-score-num">
                {home.score}
                {home.shootoutScore != null && <small> ({Math.trunc(home.shootoutScore)})</small>}
              </span>
            </>
          ) : (
            <span className="mc-kickoff">{fmtKickoff(event.date)}</span>
          )}
          <span className="mc-status">
            {live ? event.status.displayClock : isDone(event) ? 'Full time' : fmtDay(event.date)}
          </span>
        </div>
        <ScoreTeam competitor={home} />
      </div>

      <p className="mc-meta">
        {venue && <>{venue.name}{venue.city ? `, ${venue.city}` : ''}</>}
        {tv.length > 0 && <> · Watch on {tv.join(', ')}</>}
      </p>

      <OnesToWatch teams={[away.team, home.team]} />

      {error && <p className="mc-empty">Couldn't load match detail: {error}</p>}
      {!summary && !error && <p className="mc-empty">Loading match detail…</p>}

      {summary && (
        <>
          {isDone(event) && <TopPerformer summary={summary} />}
          <Formations summary={summary} event={event} />
          <StatBars summary={summary} home={home} away={away} />
          <Timeline summary={summary} home={home} away={away} />
        </>
      )}
    </section>
  )
}

function ScoreTeam({ competitor }) {
  return (
    <div className="mc-team">
      <Flag team={competitor.team} large />
      <span>{competitor.team.displayName}</span>
    </div>
  )
}

function Formations({ summary, event }) {
  const rosters = summary.rosters ?? []
  const ready =
    rosters.length === 2 &&
    rosters.every((r) => r.formation && (r.roster ?? []).some((p) => p.starter))
  if (!ready) {
    return <p className="mc-empty">Lineups post roughly an hour before kickoff.</p>
  }
  return <FormationPitch rosters={rosters} competitors={event.competitions[0].competitors} />
}

function StatBars({ summary, home, away }) {
  const teams = summary.boxscore?.teams ?? []
  const byId = new Map(teams.map((t) => [String(t.team.id), t]))
  const homeStats = statMap(byId.get(String(home.team.id)))
  const awayStats = statMap(byId.get(String(away.team.id)))
  const rows = STAT_ROWS.filter(([name]) => homeStats.has(name) && awayStats.has(name))
  if (rows.length === 0) return null

  return (
    <div className="mc-stats">
      <h3 className="mc-subhead">Match stats</h3>
      {rows.map(([name, label]) => {
        const a = Number(awayStats.get(name))
        const h = Number(homeStats.get(name))
        const total = a + h
        const awayShare = total > 0 ? (a / total) * 100 : 50
        return (
          <div key={name} className="stat-row">
            <span className="stat-num">{awayStats.get(name)}</span>
            <div className="stat-track">
              <span className="stat-label">{label}</span>
              <div className="stat-bar">
                <div className="stat-fill-away" style={{ width: `${awayShare}%` }} />
                <div className="stat-fill-home" style={{ width: `${100 - awayShare}%` }} />
              </div>
            </div>
            <span className="stat-num">{homeStats.get(name)}</span>
          </div>
        )
      })}
      <p className="stat-key">
        <span className="key-away">{away.team.abbreviation}</span> ·{' '}
        <span className="key-home">{home.team.abbreviation}</span>
      </p>
    </div>
  )
}

const statMap = (team) =>
  new Map((team?.statistics ?? []).map((s) => [s.name, s.displayValue]))

function Timeline({ summary, home, away }) {
  const abbrevs = new Map([
    [String(home.team.id), home.team.abbreviation],
    [String(away.team.id), away.team.abbreviation],
  ])
  const items = (summary.keyEvents ?? []).filter((e) => TIMELINE_CHIPS.has(e.type.text))
  if (items.length === 0) return null

  return (
    <div className="mc-timeline">
      <h3 className="mc-subhead">How it happened</h3>
      <ol>
        {items.map((e) => {
          const chip = TIMELINE_CHIPS.get(e.type.text)
          const names = (e.participants ?? [])
            .map((p) => p.athlete?.displayName)
            .filter(Boolean)
          const detail =
            e.type.text === 'Goal' && names[1] ? `assist: ${names[1]}`
            : e.type.text === 'Substitution' && names[1] ? `on for ${names[1]}`
            : ''
          return (
            <li key={e.id}>
              <span className="tl-clock">{e.clock?.displayValue ?? ''}</span>
              <span className={`tl-chip ${chip.cls}`}>{chip.label}</span>
              <span className="tl-team">{abbrevs.get(String(e.team?.id)) ?? ''}</span>
              <span className="tl-name">{names[0] ?? e.type.text}</span>
              {detail && <span className="tl-detail">{detail}</span>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
