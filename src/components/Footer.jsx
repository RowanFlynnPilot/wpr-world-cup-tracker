import { WPR_TAGLINE } from '../config.js'

export default function Footer() {
  return (
    <footer className="footer">
      <p>
        Scores, standings and match data from ESPN's public soccer feeds, refreshed
        every minute. All kickoff times shown in Central Time.
      </p>
      <p>
        This is an independent Wausau Pilot &amp; Review reader tool. It is not
        affiliated with or endorsed by FIFA, the FIFA World Cup 26™, or any
        national federation. National flags are referenced from ESPN's CDN.
      </p>
      <p className="footer-badge">Wausau Pilot &amp; Review · {WPR_TAGLINE}</p>
    </footer>
  )
}
