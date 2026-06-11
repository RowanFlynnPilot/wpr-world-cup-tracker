import { bestThirds, statDisplay } from '../lib/derive.js'

// The race most coverage skips: eight of the twelve third-placed teams also
// advance to the Round of 32. This ledger ranks them; the rule line marks
// the cut.
export default function BestThirds({ groups }) {
  const ranked = bestThirds(groups)
  if (ranked.length === 0) return null

  return (
    <section className="thirds" aria-label="Best third-placed teams">
      <h2 className="section-title">The best-thirds race</h2>
      <p className="section-dek">
        Eight of the twelve third-placed teams advance to the Round of 32 — ranked
        here by points, goal difference, then goals scored.
      </p>
      <table className="thirds-table">
        <thead>
          <tr>
            <th>#</th><th>Grp</th><th className="t-team">Team</th>
            <th>GP</th><th>Pts</th><th>GD</th><th>GF</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map(({ group, entry }, i) => (
            <tr key={entry.team.id} className={i === 8 ? 'cut-line' : i < 8 ? 'row-advance' : ''}>
              <td>{i + 1}</td>
              <td>{group}</td>
              <td className="t-team">
                <span className="team-cell">
                  <img src={entry.team.logos?.[0]?.href} alt="" className="flag" loading="lazy" />
                  {entry.team.shortDisplayName ?? entry.team.displayName}
                </span>
              </td>
              <td>{statDisplay(entry, 'gamesPlayed')}</td>
              <td className="t-pts">{statDisplay(entry, 'points')}</td>
              <td>{statDisplay(entry, 'pointDifferential')}</td>
              <td>{statDisplay(entry, 'pointsFor')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="legend">Teams above the rule are over the line as it stands.</p>
    </section>
  )
}
