// Circular player headshot, or a monogram circle when ESPN has no photo —
// coverage is thin for smaller nations, so the blank state is designed in.
export default function Face({ name, headshot }) {
  if (!headshot) {
    const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('')
    return <span className="watch-face watch-face-blank" aria-hidden="true">{initials}</span>
  }
  return <img className="watch-face" src={headshot} alt="" loading="lazy" />
}
