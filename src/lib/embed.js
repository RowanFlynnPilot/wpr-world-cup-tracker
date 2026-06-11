// Posts content height to the embedding page so it can size the iframe
// without an inner scrollbar. Inert when not iframed; only the height
// crosses the frame boundary. Each entry point passes its own message type
// so the full tracker and the mini can share a page without crosstalk —
// listener snippets for both are in docs/HANDOFF.md.
export function reportHeight(type) {
  if (window.parent === window) return
  // body.scrollHeight, not documentElement's: the latter is clamped to the
  // viewport, so a card shorter than the iframe (the mini) would report the
  // iframe's own height back and never let it shrink.
  const report = () =>
    window.parent.postMessage(
      { type, height: document.body.scrollHeight },
      '*',
    )
  // Trailing debounce: content arriving in bursts (the match center summary,
  // a dozen images) would otherwise send a flurry of resize messages, each
  // reflowing the parent page — visible as shaking while it scrolls.
  let timer = null
  const queue = () => {
    clearTimeout(timer)
    timer = setTimeout(report, 150)
  }
  // ResizeObserver tracks every layout change, but its callbacks ride the
  // rendering-frame loop, which hidden/background tabs don't run — also post
  // now, at load, and on a short timer so an embed loaded in a background tab
  // still sizes to the first data render instead of its fallback height.
  new ResizeObserver(queue).observe(document.body)
  report()
  window.addEventListener('load', queue)
  for (const ms of [1000, 3000, 8000]) setTimeout(queue, ms)
}
