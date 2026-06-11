import {
  groupByDay, fmtKickoff, awayOf, homeOf, broadcastsOf, venueOf,
  isLive, isDone, groupOf, todayKey, dayKey, fmtDay,
} from '../lib/derive.js'
import { ROUND_SLICES } from '../config.js'
import Flag from './Flag.jsx'

// The full 104-match browser, sectioned by round, grouped by Central-Time day.
// Click any row to open the Match Center. The current round opens by default.
export default function Schedule({ events, teamMap, roundOf, selectedId, onSelect }) {
  const rounds = ROUND_SLICES.map(([name]) => ({
    name,
    events: events.filter((e) => roundOf.get(e.id) === name),
  })).filter((r) => r.events.length > 0)

  const today = todayKey()
  const currentRound =
    rounds.find((r) => r.events.some((e) => !isDone(e)))?.name ?? rounds.at(-1).name

  return (
    <section className="schedule" aria-label="Full match schedule">
      <h2 className="section-title">Every match</h2>
      {rounds.map((round) => (
        <details key={round.name} open={round.name === currentRound} className="round">
          <summary className="round-summary">
            <span>{round.name}</span>
            <span className="round-count">{round.events.length} matches</span>
          </summary>
          {[...groupByDay(round.events).entries()].map(([key, dayEvents]) => (
            <div key={key} className="sched-day">
              <h3 className="sched-day-head">
                {fmtDay(dayEvents[0].date)}
                {key === today && <span className="today-tag">Today</span>}
              </h3>
              {dayEvents.map((event) => (
                <Row
                  key={event.id}
                  event={event}
                  teamMap={teamMap}
                  roundOf={roundOf}
                  selected={event.id === selectedId}
                  onSelect={onSelect}
                />
              ))}
            </div>
          ))}
        </details>
      ))}
    </section>
  )
}

function Row({ event, teamMap, roundOf, selected, onSelect }) {
  const home = homeOf(event)
  const away = awayOf(event)
  const live = isLive(event)
  const done = isDone(event)
  const venue = venueOf(event)
  const tv = broadcastsOf(event)
  const group =
    roundOf.get(event.id) === 'Group Stage' ? groupOf(event, teamMap) : null

  return (
    <button
      className={`sched-row${selected ? ' is-selected' : ''}${live ? ' is-live' : ''}`}
      onClick={() => onSelect(selected ? null : event.id)}
      aria-pressed={selected}
    >
      <span className="sched-state">
        {live && <span className="live-dot" aria-hidden="true" />}
        {live ? event.status.displayClock : done ? 'FT' : fmtKickoff(event.date)}
      </span>
      <span className="sched-teams">
        <Flag team={away.team} />
        <span className="sched-abbr">{away.team.abbreviation}</span>
        <span className="sched-score">
          {live || done ? `${away.score}–${home.score}` : 'v'}
        </span>
        <span className="sched-abbr">{home.team.abbreviation}</span>
        <Flag team={home.team} />
      </span>
      <span className="sched-where">
        {group && <span className="group-tag">Grp {group}</span>}
        {venue?.city}
        {tv.length > 0 && <span className="sched-tv"> · {tv.join(' · ')}</span>}
      </span>
    </button>
  )
}
