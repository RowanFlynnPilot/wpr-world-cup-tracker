import { useEffect, useMemo, useState } from 'react'
import { fetchSchedule, fetchStandings } from './api.js'
import { POLL_MS } from './config.js'
import { buildTeamMap, labelRounds } from './lib/derive.js'
import Masthead from './components/Masthead.jsx'
import TournamentPulse from './components/TournamentPulse.jsx'
import TodayAtTheCup from './components/TodayAtTheCup.jsx'
import MatchCenter from './components/MatchCenter.jsx'
import Schedule from './components/Schedule.jsx'
import GroupStandings from './components/GroupStandings.jsx'
import BestThirds from './components/BestThirds.jsx'
import Leaders from './components/Leaders.jsx'
import Coverage from './components/Coverage.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  const [events, setEvents] = useState(null)
  const [groups, setGroups] = useState(null)
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  // Timestamp of the last successful poll. A failed poll leaves it alone, so
  // the pulse strip's "Updated" stamp stays honest about data freshness.
  const [updatedAt, setUpdatedAt] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [sched, standings] = await Promise.all([fetchSchedule(), fetchStandings()])
        if (cancelled) return
        setEvents(sched)
        setGroups(standings)
        setUpdatedAt(new Date().toISOString())
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

  const teamMap = useMemo(() => (groups ? buildTeamMap(groups) : null), [groups])
  const roundOf = useMemo(() => (events ? labelRounds(events) : null), [events])
  const selected = useMemo(
    () => (events && selectedId ? events.find((e) => e.id === selectedId) ?? null : null),
    [events, selectedId],
  )

  if (error && !events) {
    return (
      <div className="page">
        <Masthead />
        <div className="error-card" role="alert">
          <strong>Couldn't reach the tournament feed.</strong>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try again</button>
        </div>
      </div>
    )
  }

  if (!events || !groups) {
    return (
      <div className="page">
        <Masthead />
        <p className="loading">Loading the tournament…</p>
      </div>
    )
  }

  return (
    <div className="page">
      <Masthead />
      <TournamentPulse events={events} roundOf={roundOf} updatedAt={updatedAt} />
      <TodayAtTheCup
        events={events}
        teamMap={teamMap}
        roundOf={roundOf}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      {selected && (
        <MatchCenter
          key={selected.id}
          event={selected}
          roundOf={roundOf}
          teamMap={teamMap}
          onClose={() => setSelectedId(null)}
        />
      )}
      <Coverage />
      <Schedule
        events={events}
        teamMap={teamMap}
        roundOf={roundOf}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <GroupStandings groups={groups} />
      <BestThirds groups={groups} />
      <Leaders teamMap={teamMap} />
      <Footer />
    </div>
  )
}
