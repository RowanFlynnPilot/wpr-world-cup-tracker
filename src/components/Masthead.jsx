import { WPR_LOGO, WPR_TAGLINE, SPONSORS } from '../config.js'

// WPR masthead + the widget's title. One sellable sponsor slot, top right.
export default function Masthead() {
  return (
    <header className="masthead">
      <div className="masthead-top">
        <div className="masthead-brand">
          <img src={WPR_LOGO} alt="Wausau Pilot & Review" className="masthead-logo" width="640" height="82" />
          <span className="masthead-tagline">{WPR_TAGLINE}</span>
        </div>
        <div className="masthead-sponsor">
          <span className="sponsor-eyebrow">Presented by</span>
          <span className="sponsor-name">{SPONSORS.header}</span>
        </div>
      </div>
      <div className="masthead-title">
        <h1>The 2026 World Cup, by the numbers</h1>
        <p className="dek">
          104 matches. 48 nations. 16 cities across three countries — tracked live,
          with every kickoff in Central Time.
        </p>
      </div>
    </header>
  )
}
