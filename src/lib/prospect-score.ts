/**
 * Turning a topical fit and a domain's authority into one number.
 *
 * A link is only worth having when both are true. A perfectly relevant page on
 * a site nobody links to passes almost nothing along, and a large site writing
 * about something unrelated passes along something nobody wanted. So the two
 * multiply rather than average: a near-zero on either side drags the result
 * down, which is exactly what an average would hide.
 *
 * Fit carries the larger exponent because the asymmetry is real. An irrelevant
 * link is worth nothing at any domain rank, while a relevant link on a smaller
 * site is still worth having.
 */

const FIT_WEIGHT = 0.65
const AUTHORITY_WEIGHT = 0.35

/**
 * The number shown on the card, 0 to 100.
 *
 * Returns undefined when the prospect has not been scored yet. When the
 * backlink profile is missing there is nothing to weigh the fit against, so
 * the fit stands on its own rather than being quietly halved by a zero it was
 * never given.
 */
export function overallScore(fit?: number, domainRank?: number): number | undefined {
  if (typeof fit !== 'number') return undefined
  if (typeof domainRank !== 'number') return clamp(Math.round(fit))
  if (fit <= 0 || domainRank <= 0) return 0

  const weighted = fit ** FIT_WEIGHT * domainRank ** AUTHORITY_WEIGHT

  return clamp(Math.round(weighted))
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value))
}
