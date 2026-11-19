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
 * The nightly refresh.
 *
 * A backlink profile pulled in January is not the same profile in March, and
 * a page that was on topic can be rewritten or taken down. Left alone, a board
 * quietly becomes a record of what was true the day somebody pasted it.
 *
 * The cap is the whole design. A refresh costs the same four provider calls as
 * a first review, so an uncapped task over a few large boards is a bill nobody
 * chose. Twenty a night is deliberately modest: it keeps the oldest cards
 * moving without ever being the reason for a surprise.
 */
export const REFRESH = {
  /** A review older than this is worth running again. */
  staleAfterDays: 30,

  /** The most prospects one nightly run will refresh, across every campaign. */
  maxPerRun: 20,

  /** Overnight in the time zone the desk works in. */
  schedule: '0 3 * * *',
  timezone: 'America/New_York',
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
