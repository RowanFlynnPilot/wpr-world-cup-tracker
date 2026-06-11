// National flag from ESPN's CDN. Knockout placeholders ("Group G Winner",
// "3rd Place Group A/E/H/I/J") publish with logo: '' — render an equal-size
// invisible spacer instead of a broken image, so resolved and unresolved
// teams keep the same alignment in mixed lists.
export default function Flag({ team, large = false }) {
  const cls = large ? 'flag flag-lg' : 'flag'
  if (!team.logo) return <span className={`${cls} flag-tbd`} aria-hidden="true" />
  return <img src={team.logo} alt="" className={cls} loading="lazy" />
}
