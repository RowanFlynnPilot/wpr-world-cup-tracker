import { topPerformer } from '../lib/derive.js'
import Face from './Face.jsx'

// For completed matches: the match's top performer with their stat line
// ("2 goals, 1 assist"), derived from the summary box score — see
// topPerformer() in derive.js for the rule. Renders nothing when the
// summary has no player stats or nobody produced a goal, assist, or shot
// on target.
export default function TopPerformer({ summary }) {
  const pick = topPerformer(summary)
  if (!pick) return null

  return (
    <div className="watch">
      <span className="watch-label">Top performer</span>
      <div className="watch-strip">
        <div className="watch-chip">
          <Face name={pick.name} headshot={pick.headshot} />
          <span className="watch-text">
            <span className="watch-name">{pick.name}</span>
            <span className="watch-stat">{pick.teamAbbrev} · {pick.statLine}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
