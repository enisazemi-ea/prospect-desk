/**
 * Everything about a review that someone might want to change.
 *
 * The model, the weighting, how much of a page the scorer reads, how many
 * reviews one job will run: all tunables in one file rather than scattered
 * through the pipeline. When a review costs money per prospect, the numbers
 * that decide how much are worth keeping where a reader can find them.
 */

export const REVIEW = {
  /**
   * Haiku rather than a larger model. This is a short judgement over one page
   * of text, run once per prospect across lists of hundreds, so cost per card
   * is what matters.
   */
  scoringModel: 'claude-haiku-5-5',

  /** Enough of the page to judge it; the rest is navigation and comments. */
  pageCharactersForScoring: 6000,

  /** Room for the reason and the angle, and no room to ramble. */
  scoringMaxTokens: 700,

  /** Low, because this is a judgement rather than a piece of writing. */
  scoringTemperature: 0.2,

  /**
   * How many prospects one background job reviews before it checkpoints.
   * Each prospect is four provider calls, and a Worker has a ceiling on
   * subrequests per invocation.
   */
  prospectsPerJobTick: 5,
} as const

/**
 * The weighting behind the number on the card.
 *
 * Topical fit and domain authority multiply rather than average, and fit
 * carries the larger exponent. The reasoning is in src/lib/prospect-score.ts,
 * next to the function that applies it.
 */
export const SCORE_WEIGHTS = {
  fit: 0.65,
  authority: 0.35,
} as const
