// The widget's signature element: one editorial pitch, both XIs. Paper-toned
// field, hairline markings in the suite's rule language, team-colored dots.
// Away XI defends the top goal, home XI defends the bottom goal, both attack
// the halfway line — the standard broadcast tactics-board orientation.
//
// Layout is driven entirely by ESPN's data: the formation string ("4-2-3-1")
// gives the row sizes, and formationPlace orders the starters into those rows
// (place 1 is always the goalkeeper).

const W = 360
const H = 560
const MARGIN_X = 34

export default function FormationPitch({ rosters, competitors }) {
  const byId = new Map(competitors.map((c) => [String(c.team.id), c]))
  const placed = rosters.map((r) => ({
    roster: r,
    competitor: byId.get(String(r.team.id)),
  }))
  const home = placed.find((p) => p.competitor?.homeAway === 'home')
  const away = placed.find((p) => p.competitor?.homeAway === 'away')
  if (!home || !away) return null

  return (
    <figure className="pitch-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="pitch" role="img"
        aria-label={`Starting lineups: ${away.roster.team.displayName} in a ${away.roster.formation}, ${home.roster.team.displayName} in a ${home.roster.formation}`}>
        <PitchMarkings />
        <Eleven side="away" roster={away.roster} competitor={away.competitor} />
        <Eleven side="home" roster={home.roster} competitor={home.competitor} />
      </svg>
      <figcaption className="pitch-caption">
        <span>{away.roster.team.abbreviation ?? away.roster.team.displayName} · {away.roster.formation}</span>
        <span>{home.roster.team.abbreviation ?? home.roster.team.displayName} · {home.roster.formation}</span>
      </figcaption>
    </figure>
  )
}

function PitchMarkings() {
  return (
    <g>
      <rect x="6" y="6" width={W - 12} height={H - 12} rx="10" className="pitch-field" />
      <line x1="6" y1={H / 2} x2={W - 6} y2={H / 2} className="pitch-line" />
      <circle cx={W / 2} cy={H / 2} r="42" className="pitch-line-fill" />
      {/* top goal area */}
      <rect x={(W - 150) / 2} y="6" width="150" height="56" className="pitch-line-fill" />
      <rect x={(W - 66) / 2} y="6" width="66" height="24" className="pitch-line-fill" />
      {/* bottom goal area */}
      <rect x={(W - 150) / 2} y={H - 62} width="150" height="56" className="pitch-line-fill" />
      <rect x={(W - 66) / 2} y={H - 30} width="66" height="24" className="pitch-line-fill" />
    </g>
  )
}

function Eleven({ side, roster, competitor }) {
  const starters = (roster.roster ?? [])
    .filter((p) => p.starter)
    .sort((a, b) => Number(a.formationPlace) - Number(b.formationPlace))
  const rowSizes = [1, ...roster.formation.split('-').map(Number)]
  const color = competitor?.team?.color ? `#${competitor.team.color}` : '#1a1a1a'

  // GK on the goal line, lines advancing toward the halfway line.
  const yStart = side === 'away' ? 44 : H - 44
  const yEnd = side === 'away' ? H / 2 - 34 : H / 2 + 34
  const yStep = rowSizes.length > 1 ? (yEnd - yStart) / (rowSizes.length - 1) : 0

  const dots = []
  let cursor = 0
  rowSizes.forEach((size, rowIndex) => {
    const row = starters.slice(cursor, cursor + size)
    cursor += size
    const y = yStart + yStep * rowIndex
    row.forEach((player, i) => {
      const x = MARGIN_X + (W - MARGIN_X * 2) * ((i + 0.5) / row.length)
      dots.push({ player, x, y })
    })
  })

  return (
    <g>
      {dots.map(({ player, x, y }) => (
        <g key={player.athlete.id ?? player.jersey} className="pitch-player">
          <circle cx={x} cy={y} r="13" fill={color} className="pitch-dot" />
          <text x={x} y={y + 4} textAnchor="middle" className="pitch-number">
            {player.jersey}
          </text>
          <text x={x} y={y + (side === 'away' ? 27 : -19)} textAnchor="middle" className="pitch-name">
            {player.athlete.shortName ?? player.athlete.displayName}
          </text>
        </g>
      ))}
    </g>
  )
}
