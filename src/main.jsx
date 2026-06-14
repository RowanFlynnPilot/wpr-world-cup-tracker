import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { reportHeight } from './lib/embed.js'
import { initAnalytics } from './lib/analytics.js'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

reportHeight('wpr-world-cup-tracker:height')
initAnalytics()
