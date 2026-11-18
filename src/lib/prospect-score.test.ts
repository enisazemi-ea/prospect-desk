import { describe, expect, it } from 'vitest'
import { overallScore } from './prospect-score'

describe('overallScore', () => {
  it('is undefined before the prospect has been scored', () => {
    expect(overallScore(undefined, 59)).toBeUndefined()
  })

  it('falls back to the fit alone when there is no backlink profile', () => {
    expect(overallScore(72, undefined)).toBe(72)
  })

  it('ranks a relevant page on a strong site above an irrelevant one', () => {
    const relevant = overallScore(72, 59)
    const irrelevant = overallScore(28, 55)
    expect(relevant).toBeGreaterThan(irrelevant as number)
  })

  it('does not let a large site carry an irrelevant page', () => {
    // A domain rank of 90 against a fit of 10 should still read as a reject,
    // which is the whole reason the two multiply rather than average.
    expect(overallScore(10, 90)).toBeLessThan(30)
  })

  it('does not let a strong fit carry a site with no authority', () => {
    expect(overallScore(95, 3)).toBeLessThan(40)
  })

  it('is zero when either side is zero', () => {
    expect(overallScore(0, 80)).toBe(0)
    expect(overallScore(80, 0)).toBe(0)
  })

  it('stays inside 0 and 100', () => {
    expect(overallScore(100, 100)).toBe(100)
  })
})
