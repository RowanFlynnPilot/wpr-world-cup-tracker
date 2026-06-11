import { TOTAL_MATCHES } from '../config.js'
import {
  pulse, fmtDay, fmtKickoff, awayOf, homeOf, broadcastsOf, venueOf,
} from '../lib/derive.js'

// The thesis strip: where the tournament stands right now, and the next
// fixture that matters to a Wisconsin reader (the USMNT while they last).
export default function TournamentPulse({ events, roundOf, updatedAt }) {
  const p = pulse(events)

  return (
    <section className="pulse" aria-label="Tournament pulse">
      {updatedAt && <span className="pulse-updated">Updated {fmtKickoff(updatedAt)}</span>}
      <div className="pulse-stats">
        <Stat value={`${p.played}`} label={`of ${TOTAL_MATCHES} matches played`} />
        <Stat value={`${p.goals}`} label="goals scored" />
        <Stat value={p.perMatch} label="goals per match" />
        <Stat
          value={p.live.length > 0 ? `${p.live.length}` : '—'}
          label={p.live.length === 1 ? 'match in play' : 'matches in play'}
          live={p.live.length > 0}
        />
      </div>
      {p.next && <NextMatch event={p.next} hero={p.nextIsHero} roundOf={roundOf} />}
    </section>
  )
}

function Stat({ value, label, live }) {
  return (
    <div className={live ? 'pulse-stat is-live' : 'pulse-stat'}>
      <span className="pulse-value">{value}</span>
      <span className="pulse-label">{label}</span>
    </div>
  )
}

function NextMatch({ event, hero, roundOf }) {
  const home = homeOf(event)
  const away = awayOf(event)
  const venue = venueOf(event)
  const tv = broadcastsOf(event)
  return (
    <p className="pulse-next">
      <span className="pulse-next-eyebrow">{hero ? 'Next for the USMNT' : 'Next match'}</span>{' '}
      <strong>
        {away.team.displayName} at {home.team.displayName}
      </strong>{' '}
      · {roundOf.get(event.id)} · {fmtDay(event.date)}, {fmtKickoff(event.date)}
      {venue && <> · {venue.name}{venue.city ? `, ${venue.city}` : ''}</>}
      {tv.length > 0 && <> · Watch on {tv.join(', ')}</>}
    </p>
  )
}
