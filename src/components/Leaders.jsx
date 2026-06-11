import { useEffect, useState } from 'react'
import { fetchLeaders, hydrateAthletes, LEADERS_PER_CATEGORY } from '../api.js'
import { LEADERS_POLL_MS, SPONSORS } from '../config.js'

// Tournament leaders: the Golden Boot race plus the boards a soccer reader
// actually argues about. The leaders document 404s until the first match has
// been played; that renders as the pre-tournament state, by design.
const BOARDS = [
  ['goals', 'Golden Boot', 'goals'],
  ['assists', 'Playmakers', 'assists'],
  ['saves', 'Safe hands', 'saves'],
  ['yellowCards', 'Walking a tightrope', 'yellow cards'],
]

export default function Leaders({ teamMap }) {
  const [boards, setBoards] = useState(null) // null=loading, 'pending'=no stats yet
  const [error, setError] = useState(null)

  // Loads on mount, then re-polls on the slow leaders cadence. A failed
  // re-poll keeps the last good boards; only a failed first load surfaces
  // the error state.
  useEffect(() => {
    let cancelled = false
    let loaded = false
    async function load() {
      const doc = await fetchLeaders()
      if (doc === null) {
        if (!cancelled) {
          loaded = true
          setBoards('pending')
          setError(null)
        }
        return
      }
      const byName = new Map(doc.categories.map((c) => [c.name, c]))
      const picked = BOARDS.map(([name, title, unit]) => ({
        title,
        unit,
        leaders: (byName.get(name)?.leaders ?? []).slice(0, LEADERS_PER_CATEGORY),
      })).filter((b) => b.leaders.length > 0)

      const athleteMap = await hydrateAthletes(
        picked.flatMap((b) => b.leaders.map((l) => l.athlete.$ref)),
      )
      if (cancelled) return
      loaded = true
      setError(null)
      setBoards(
        picked.map((b) => ({
          ...b,
          leaders: b.leaders.map((l) => ({
            value: l.displayValue,
            athlete: athleteMap.get(l.athlete.$ref),
            teamId: l.team?.$ref?.match(/\/teams\/(\d+)/)?.[1] ?? null,
          })),
        })),
      )
    }
    const run = () => load().catch((err) => { if (!cancelled && !loaded) setError(err.message) })
    run()
    const timer = setInterval(run, LEADERS_POLL_MS)
    return () => { cancelled = true; clearInterval(timer) }
  }, [])

  return (
    <section className="leaders" aria-label="Tournament leaders">
      <div className="section-head">
        <h2 className="section-title">Tournament leaders</h2>
        <span className="sponsor-inline">
          <span className="sponsor-eyebrow">Presented by</span> {SPONSORS.leaders}
        </span>
      </div>

      {error && <p className="mc-empty">Couldn't load leaders: {error}</p>}
      {boards === null && !error && <p className="mc-empty">Loading leaders…</p>}
      {boards === 'pending' && (
        <p className="mc-empty">
          The boards open with the first whistle — goals, assists and saves will
          rank here once matches are played.
        </p>
      )}

      {Array.isArray(boards) && (
        <div className="leaders-grid">
          {boards.map((board) => (
            <div key={board.title} className="leader-card">
              <h3 className="leader-title">{board.title}</h3>
              <ol>
                {board.leaders.map((l, i) => (
                  <li key={`${board.title}-${i}`}>
                    <span className="leader-rank">{i + 1}</span>
                    {l.athlete?.flag?.href && (
                      <img src={l.athlete.flag.href} alt="" className="flag" loading="lazy" />
                    )}
                    <span className="leader-name">{l.athlete?.displayName ?? '—'}</span>
                    <span className="leader-team">
                      {teamMap.get(l.teamId)?.abbrev ?? ''}
                    </span>
                    <span className="leader-value">{l.value}</span>
                  </li>
                ))}
              </ol>
              <span className="leader-unit">{board.unit}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
