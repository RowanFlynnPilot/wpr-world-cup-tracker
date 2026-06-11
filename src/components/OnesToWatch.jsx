import { useEffect, useState } from 'react'
import { fetchTeamLeaders, hydrateAthletes } from '../api.js'
import { LEADERS_POLL_MS } from '../config.js'
import { featuredFromLeaders } from '../lib/derive.js'

// Each team's featured player: the tournament leading scorer (assists, then
// saves, as fallbacks — see featuredFromLeaders). Headshot when ESPN has one,
// a monogram circle when it doesn't (coverage is thin for smaller nations).
// Renders nothing until a team has earned a stat — the per-team leaders doc
// 404s before a team's first match, by design.
//
// Module-level cache so the match center and the mini cards share per-team
// lookups; entries expire on the leaders cadence so a live match's goals
// refresh the names. A failed lookup is evicted so the next mount retries.
const cache = new Map() // teamId -> { at, promise }

function loadFeatured(teamId) {
  const hit = cache.get(teamId)
  if (hit && Date.now() - hit.at < LEADERS_POLL_MS) return hit.promise
  const promise = (async () => {
    const doc = await fetchTeamLeaders(teamId)
    const pick = featuredFromLeaders(doc)
    if (!pick) return null
    const athletes = await hydrateAthletes([pick.athleteRef])
    const a = athletes.get(pick.athleteRef)
    return {
      name: a.shortName ?? a.displayName,
      headshot: a.headshot?.href ?? null,
      value: pick.value,
      unit: pick.unit,
    }
  })()
  promise.catch(() => cache.delete(teamId))
  cache.set(teamId, { at: Date.now(), promise })
  return promise
}

export default function OnesToWatch({ teams }) {
  const [players, setPlayers] = useState(null)
  const key = teams.map((t) => t.id).join('-')

  useEffect(() => {
    let cancelled = false
    Promise.all(teams.map((t) => loadFeatured(String(t.id)).catch(() => null)))
      .then((res) => { if (!cancelled) setPlayers(res) })
    return () => { cancelled = true }
  }, [key])

  if (!players || players.every((p) => p === null)) return null

  return (
    <div className="watch">
      <span className="watch-label">Ones to watch</span>
      <div className="watch-strip">
        {players.map((p, i) => p && (
          <div key={teams[i].id} className="watch-chip">
            <Face player={p} />
            <span className="watch-text">
              <span className="watch-name">{p.name}</span>
              <span className="watch-stat">
                {teams[i].abbreviation} · {p.value} {p.unit}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Face({ player }) {
  if (!player.headshot) {
    const initials = player.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('')
    return <span className="watch-face watch-face-blank" aria-hidden="true">{initials}</span>
  }
  return <img className="watch-face" src={player.headshot} alt="" loading="lazy" />
}
