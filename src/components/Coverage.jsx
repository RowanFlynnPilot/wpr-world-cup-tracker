import { useEffect, useState } from 'react'
import { fetchCoverage } from '../api.js'
import { LEADERS_POLL_MS } from '../config.js'
import { fmtDay } from '../lib/derive.js'
import { track } from '../lib/analytics.js'

// The Pilot & Review's own World Cup writing, pulled live from the WPR site's
// "2026 World Cup" category. Headline index, newest first; each links out to
// the article (target=_top to leave the iframe). Auxiliary content from a
// WAF-protected source — on failure the section simply hides rather than
// showing an error, the same posture as the pre-whistle leaders state.

// WordPress titles/excerpts carry HTML entities (&amp;, &#8217;). Decode for
// display via a detached textarea — text only, nothing is executed.
function decodeEntities(s) {
  const el = document.createElement('textarea')
  el.innerHTML = s
  return el.value
}

export default function Coverage() {
  const [posts, setPosts] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = () =>
      fetchCoverage()
        .then((data) => { if (!cancelled) setPosts(Array.isArray(data) ? data : []) })
        .catch(() => { if (!cancelled) setPosts((prev) => prev ?? []) })
    load()
    const timer = setInterval(load, LEADERS_POLL_MS)
    return () => { cancelled = true; clearInterval(timer) }
  }, [])

  if (!posts || posts.length === 0) return null

  return (
    <section className="coverage" aria-label="WPR World Cup coverage">
      <h2 className="section-title">From the WPR newsroom</h2>
      <p className="section-dek">
        The Pilot &amp; Review's latest World Cup coverage.
      </p>
      <ul className="coverage-list">
        {posts.map((post) => (
          <li key={post.link}>
            <a
              href={post.link}
              target="_top"
              rel="noopener"
              onClick={() => track('Coverage article click')}
            >
              <span className="coverage-date">{fmtDay(`${post.date_gmt}Z`)}</span>
              <span className="coverage-title">{decodeEntities(post.title.rendered)}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
