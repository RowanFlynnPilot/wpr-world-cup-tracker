// Entry for the mini embed (mini.html): one compact card for a sidebar or
// an in-article slot — the live match while one is on, otherwise the next
// kickoff. Same data path and design language as the full tracker.
import React from 'react'
import { createRoot } from 'react-dom/client'
import MiniMatch from './components/MiniMatch.jsx'
import { reportHeight } from './lib/embed.js'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MiniMatch />
  </React.StrictMode>,
)

reportHeight('wpr-world-cup-tracker:mini-height')