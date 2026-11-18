import type { ActionHandler } from 'deepspace/worker'
import type { Env } from '../../worker'
import { loadSampleCampaign } from './load-sample-campaign'
import { reviewProspect } from './review-prospect'

/**
 * Server actions, each exposed at POST /api/actions/<name>.
 *
 * The worker verifies the caller's token before a handler runs, so these are
 * the right home for anything that spends money or has to produce the same
 * answer for everyone looking at a board.
 */
export const actions: Record<string, ActionHandler<Env>> = {
  loadSampleCampaign,
  reviewProspect,
}
