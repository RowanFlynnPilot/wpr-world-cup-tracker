import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// When embedded (the WPR WordPress iframe), report content height to the
// parent page so it can size the iframe without an inner scrollbar. Inert
// when nothing listens; the WordPress-side listener is in docs/HANDOFF.md.
// Only the widget's height crosses the frame boundary.
if (window.parent !== window) {
  const report = () =>
    window.parent.postMessage(
      { type: 'wpr-world-cup-tracker:height', height: document.documentElement.scrollHeight },
      '*',
    )
  new ResizeObserver(report).observe(document.documentElement)
}
