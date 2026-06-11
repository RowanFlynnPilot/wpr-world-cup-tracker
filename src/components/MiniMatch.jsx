import { useEffect, useState } from 'react'
import { fetchSchedule, fetchMatchSummary } from '../api.js'
import { HERO_TEAM_ID, POLL_MS } from '../config.js'
import {
  featuredMatches, labelRounds, fmtKickoff, fmtDayRelative, awayOf, homeOf,
  broadcastsOf, venueOf, isLive, isDone, competitorsOf,
} from '../lib/derive.js'
import Flag from './Flag.jsx'
import OnesToWatch from './OnesToWatch.jsx'
import TopPerformer from './TopPerformer.jsx'

// The sidebar-size tracker: the marquee match (live first, next kickoff
// otherwise) plus the USMNT's next game when that's a different match — one
// card when the USMNT is itself live or next. Scoreboard only — no standings
// call — to keep the per-article footprint at one request a minute. Optional
// ?link= query param renders a "Full tracker" link (target=_top so it
// navigates the reader's page, not the iframe).
export default function MiniMatch() {
  const [events, setEvents] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const sched = await fetchSchedule()
        if (cancelled) return
        setEvents(sched)
        setError(null)
      } catch (err) {
        if (!cancelled) setError(err.message)
      }
    }
    load()
    const timer = setInterval(load, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  if (error && !events) {
    return <div className="mini"><Band /><p className="mini-note">Couldn't reach the tournament feed.</p></div>
  }
  if (!events) {
    return <div className="mini"><Band /><p className="mini-note">Loading the Cup…</p></div>
  }

  const matches = featuredMatches(events)
  if (matches.length === 0) return null
  const roundOf = labelRounds(events)
  const link = new URLSearchParams(window.location.search).get('link')

  return (
    <div className="mini">
      <Band />
      {matches.map((event) => (
        <MiniCard key={event.id} event={event} round={roundOf.get(event.id)} />
      ))}
      <div className="mini-foot">
        <span>Wausau Pilot &amp; Review</span>
        {link && <a className="mini-link" href={link} target="_top" rel="noopener">Full tracker →</a>}
      </div>
    </div>
  )
}

// The masthead band: ink field, paper serif, teal underline — the same
// section-front language as the publication's chrome.
function Band() {
  return (
    <div className="mini-band">
      <h1 className="mini-title">The 2026 World Cup</h1>
    </div>
  )
}

function MiniCard({ event, round }) {
  const away = awayOf(event)
  const home = homeOf(event)
  const live = isLive(event)
  const done = isDone(event)
  const hero = competitorsOf(event).some((c) => String(c.team.id) === HERO_TEAM_ID)
  const eyebrow = live
    ? hero ? 'USMNT live' : 'Live at the Cup'
    : done ? 'Final'
    : hero ? 'Next for the USMNT' : 'Next at the Cup'
  const venue = venueOf(event)
  const tv = broadcastsOf(event)
  // Live gets the red bleed band; the hometown match gets the teal rail
  // (red wins when the USMNT is the live match).
  const blockCls = `mini-match${live ? ' is-live' : hero ? ' is-hero' : ''}`

  return (
    <div className={blockCls}>
      <div className="mini-head">
        <span className={`mini-eyebrow${live ? ' is-live' : ''}`}>
          {live && <span className="live-dot" aria-hidden="true" />}
          {eyebrow}
        </span>
        <span className="mini-round">{round}</span>
      </div>

      <TeamRow competitor={away} showScore={live || done} />
      <TeamRow competitor={home} showScore={live || done} />

      <p className={`mini-when${live ? ' is-live' : ''}`}>
        {live ? event.status.displayClock : done ? 'Full time' : `${fmtKickoff(event.date)} · ${fmtDayRelative(event.date)}`}
      </p>
      {venue && (
        <p className="mini-venue">{venue.name}{venue.city ? `, ${venue.city}` : ''}</p>
      )}
      {!done && tv.length > 0 && (
        <div className="mini-tv">
          <span className="mini-tv-label">Watch</span>
          {tv.map((name) => <span key={name} className="tv-chip">{name}</span>)}
        </div>
      )}
      {done && <DonePerformer eventId={event.id} />}
      <OnesToWatch teams={[away.team, home.team]} />
    </div>
  )
}

// The mini only shows a completed match once the tournament is over (the
// final). One cached summary fetch powers its top-performer chip; a failure
// just leaves the chip off — it's auxiliary content.
const summaryCache = new Map()
function DonePerformer({ eventId }) {
  const [summary, setSummary] = useState(null)
  useEffect(() => {
    let cancelled = false
    if (!summaryCache.has(eventId)) summaryCache.set(eventId, fetchMatchSummary(eventId))
    summaryCache.get(eventId)
      .then((data) => { if (!cancelled) setSummary(data) })
      .catch(() => summaryCache.delete(eventId))
    return () => { cancelled = true }
  }, [eventId])
  return summary ? <TopPerformer summary={summary} /> : null
}

function TeamRow({ competitor, showScore }) {
  const so = competitor.shootoutScore
  return (
    <div className="mini-team">
      <Flag team={competitor.team} />
      <span className="mini-name">{competitor.team.displayName}</span>
      {showScore && (
        <span className="mini-score">
          {competitor.score}
          {so != null && <span className="pens"> ({Math.trunc(so)})</span>}
        </span>
      )}
    </div>
  )
}
