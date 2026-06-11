import { useEffect, useState } from 'react'
import { fetchSchedule } from '../api.js'
import { HERO_TEAM_ID, POLL_MS } from '../config.js'
import {
  featuredMatch, labelRounds, fmtKickoff, fmtDay, awayOf, homeOf,
  broadcastsOf, venueOf, isLive, isDone, competitorsOf,
} from '../lib/derive.js'
import Flag from './Flag.jsx'

// The sidebar-size tracker: one featured match (live first, next kickoff
// otherwise), polled on the scoreboard cadence. Scoreboard only — no
// standings call — to keep the per-article footprint at one request a minute.
// Optional ?link= query param renders a "Full tracker" link (target=_top so
// it navigates the reader's page, not the iframe).
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
    return <div className="mini"><p className="mini-note">Couldn't reach the tournament feed.</p></div>
  }
  if (!events) {
    return <div className="mini"><p className="mini-note">Loading the Cup…</p></div>
  }

  const event = featuredMatch(events)
  if (!event) return null

  const live = isLive(event)
  const done = isDone(event)
  const home = homeOf(event)
  const away = awayOf(event)
  const venue = venueOf(event)
  const tv = broadcastsOf(event)
  const round = labelRounds(events).get(event.id)
  const link = new URLSearchParams(window.location.search).get('link')
  const hero = competitorsOf(event).some((c) => String(c.team.id) === HERO_TEAM_ID)
  const eyebrow = live
    ? hero ? 'USMNT live' : 'Live at the Cup'
    : done ? 'Final'
    : hero ? 'Next for the USMNT' : 'Next at the Cup'

  return (
    <div className="mini">
      <div className="mini-head">
        <span className={`mini-eyebrow${live ? ' is-live' : ''}`}>
          {live && <span className="live-dot" aria-hidden="true" />}
          {eyebrow}
        </span>
        <span className="mini-round">{round}</span>
      </div>

      <TeamRow competitor={away} showScore={live || done} />
      <TeamRow competitor={home} showScore={live || done} />

      <p className="mini-when">
        {live ? event.status.displayClock : done ? 'Full time' : `${fmtKickoff(event.date)} · ${fmtDay(event.date)}`}
      </p>
      {venue && (
        <p className="mini-venue">{venue.name}{venue.city ? `, ${venue.city}` : ''}</p>
      )}
      {!done && tv.length > 0 && (
        <div className="mini-tv">
          {tv.map((name) => <span key={name} className="tv-chip">{name}</span>)}
        </div>
      )}

      <div className="mini-foot">
        <span>Wausau Pilot &amp; Review</span>
        {link && <a className="mini-link" href={link} target="_top" rel="noopener">Full tracker →</a>}
      </div>
    </div>
  )
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
