import { SPONSORS } from '../config.js'
import { statDisplay, statVal } from '../lib/derive.js'

// All twelve group tables. Top two in each group advance outright; third place
// goes into the best-thirds race (see the ledger below the grid).
export default function GroupStandings({ groups }) {
  return (
    <section className="groups" aria-label="Group standings">
      <div className="section-head">
        <h2 className="section-title">The twelve groups</h2>
        {SPONSORS.standings && (
          <span className="sponsor-inline">
            <span className="sponsor-eyebrow">Presented by</span> {SPONSORS.standings}
          </span>
        )}
      </div>
      <div className="groups-grid">
        {groups.map((group) => (
          <GroupCard key={group.id ?? group.name} group={group} />
        ))}
      </div>
      <p className="legend">
        <span className="legend-swatch swatch-teal" /> advances ·{' '}
        <span className="legend-swatch swatch-gold" /> in best-thirds contention
      </p>
    </section>
  )
}

function GroupCard({ group }) {
  // Render by the rank stat, not array order — ESPN usually pre-sorts, but
  // the rank is the contract.
  const entries = [...group.standings.entries].sort(
    (a, b) => statVal(a, 'rank') - statVal(b, 'rank'),
  )
  return (
    <div className="group-card">
      <h3 className="group-name">{group.name}</h3>
      <table>
        <thead>
          <tr>
            <th className="t-team">Team</th>
            <th>GP</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const rank = statVal(entry, 'rank')
            const cls = rank <= 2 ? 'row-advance' : rank === 3 ? 'row-third' : ''
            return (
              <tr key={entry.team.id} className={cls}>
                <td className="t-team">
                  <img src={entry.team.logos?.[0]?.href} alt="" className="flag" loading="lazy" />
                  {entry.team.shortDisplayName ?? entry.team.displayName}
                </td>
                <td>{statDisplay(entry, 'gamesPlayed')}</td>
                <td>{statDisplay(entry, 'wins')}</td>
                <td>{statDisplay(entry, 'ties')}</td>
                <td>{statDisplay(entry, 'losses')}</td>
                <td>{statDisplay(entry, 'pointDifferential')}</td>
                <td className="t-pts">{statDisplay(entry, 'points')}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
