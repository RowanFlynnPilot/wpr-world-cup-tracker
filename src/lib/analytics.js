// Plausible analytics, injected at runtime — no static tag, no npm dependency,
// the same pattern and the same data-domain as wpr-brewers-tracker. Both World
// Cup entry points report into the shared rowanflynnpilot.github.io dashboard,
// told apart by page path: "/wpr-world-cup-tracker/" (full) and
// "/wpr-world-cup-tracker/mini.html" (mini). Cookieless and privacy-friendly;
// the script is the stock plausible.io build.
const PLAUSIBLE = {
  domain: 'rowanflynnpilot.github.io',
  src: 'https://plausible.io/js/script.js',
}

let loaded = false

// Inject the Plausible script once. The queue stub means track() calls made
// before the script finishes loading still register once it does. Safe to call
// from every entry point; only the first call does anything.
export function initAnalytics() {
  if (loaded || typeof window === 'undefined') return
  loaded = true
  window.plausible =
    window.plausible ||
    function () {
      ;(window.plausible.q = window.plausible.q || []).push(arguments)
    }
  const el = document.createElement('script')
  el.defer = true
  el.src = PLAUSIBLE.src
  el.setAttribute('data-domain', PLAUSIBLE.domain)
  document.head.appendChild(el)
}

// Fire a custom event. No-op until initAnalytics has run. Add a matching goal
// in the Plausible dashboard for the event to surface under Goal Conversions.
export function track(event, props) {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(event, props ? { props } : undefined)
  }
}
