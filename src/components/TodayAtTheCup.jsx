import {
  currentSlate, fmtKickoff, awayOf, homeOf, broadcastsOf, venueOf,
  isLive, isDone, groupOf,
} from '../lib/derive.js'

// The day's slate, broadcast-forward: this is the "where to watch" surface.
// Clicking a card opens the Match Center.
export default function TodayAtTheCup({ events, teamMap, roundOf, selectedId, onSelect }) {
  const slate = currentSlate(events)
  if (slate.events.length === 0) return null

  return (
    <section className="today" aria-label={slate.label}>
      <h2 className="section-title">{slate.label}</h2>
      <div className="today-grid">
        {slate.events.map((event) => (
          <MatchCard
            key={event.id}
            event={event}
            teamMap={teamMap}
            roundOf={roundOf}
            selected={event.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  )
}

function MatchCard({ event, teamMap, roundOf, selected, onSelect }) {
  const home = homeOf(event)
  const away = awayOf(event)
  const venue = venueOf(event)
  const tv = broadcastsOf(event)
  const live = isLive(event)
  const done = isDone(event)
  const round = roundOf.get(event.id)
  const group = round === 'Group Stage' ? groupOf(event, teamMap) : null

  return (
    <button
      className={`match-card${selected ? ' is-selected' : ''}${live ? ' is-live' : ''}`}
      onClick={() => onSelect(selected ? null : event.id)}
      aria-pressed={selected}
    >
      <div className="match-card-meta">
        <span>{group ? `Group ${group}` : round}</span>
        <span className="match-card-state">
          {live && <span className="live-dot" aria-hidden="true" />}
          {live ? event.status.displayClock : done ? 'Final' : fmtKickoff(event.date)}
        </span>
      </div>
      <TeamLine competitor={away} showScore={live || done} />
      <TeamLine competitor={home} showScore={live || done} />
      <div className="match-card-foot">
        {venue && <span className="match-card-venue">{venue.city}</span>}
        {tv.length > 0 && (
          <span className="tv-chips">
            {tv.map((name) => (
              <span key={name} className="tv-chip">{name}</span>
            ))}
          </span>
        )}
      </div>
    </button>
  )
}

function TeamLine({ competitor, showScore }) {
  const so = competitor.shootoutScore
  return (
    <div className="match-card-team">
      <img src={competitor.team.logo} alt="" className="flag" loading="lazy" />
      <span className="match-card-name">{competitor.team.displayName}</span>
      {showScore && (
        <span className="match-card-score">
          {competitor.score}
          {so != null && <span className="pens"> ({Math.trunc(so)})</span>}
        </span>
      )}
    </div>
  )
}
