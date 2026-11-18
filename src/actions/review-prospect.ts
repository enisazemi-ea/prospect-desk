import { enqueueJob } from 'deepspace/worker'
import type { ActionHandler } from 'deepspace/worker'
import type { Env } from '../../worker'
import type { Prospect } from '../lib/records'
import type { ReviewRequest } from '../server/review-prospect'

/**
 * Ask for a prospect to be reviewed.
 *
 * The action authorizes the caller, marks the card as running, and hands the
 * work to a background job. It does not wait for the review: four provider
 * calls take most of a minute, and a board of forty pasted urls would mean
 * forty held connections.
 *
 * Note that the tools an action is handed reach the record room with
 * per-record permissions switched off, so nothing here is authorized by the
 * schema. The role check is this action's own, and it has to be: without it
 * any signed-in visitor could spend the owner's integration budget one paste
 * at a time.
 */
export const reviewProspect: ActionHandler<Env> = async ({ params, tools, userId, env }) => {
  const prospectId = params.prospectId
  if (typeof prospectId !== 'string' || prospectId === '') {
    return { success: false, error: 'prospectId is required.' }
  }

  const caller = await tools.get('users', userId)
  if (!caller.success) return caller

  const { role } = fieldsOf<{ role?: string }>(caller.data)
  if (role !== 'member' && role !== 'admin') {
    return { success: false, error: 'Only members of this desk can run a review.' }
  }

  const found = await tools.get('prospects', prospectId)
  if (!found.success) return found

  const prospect = fieldsOf<Prospect>(found.data)

  const campaign = await tools.get('campaigns', prospect.campaignId)
  if (!campaign.success) return campaign

  const { topic, clientSite } = fieldsOf<{ topic: string; clientSite: string }>(campaign.data)

  // Flip the card into its running state before enqueuing, so anyone else on
  // the board can see the review is under way and does not start it again.
  await tools.update('prospects', prospectId, { reviewState: 'running', reviewError: '' })

  const request: ReviewRequest = {
    prospectId,
    url: prospect.url,
    domain: prospect.domain,
    topic,
    clientSite,
  }

  const jobId = await enqueueJob(
    env.JOB_ROOMS,
    `app:${env.DEEPSPACE_APP_ID}`,
    'review-prospect',
    request as unknown as Record<string, unknown>,
    // One attempt. A retry would repeat four billed calls for a url that is
    // just as unreadable the second time, and the card already says why.
    { maxAttempts: 1, enqueuedBy: userId },
  )

  return { success: true, data: { jobId } }
}

/**
 * Read a record's fields out of a `tools.get` result.
 *
 * The tools API answers with `Record<string, unknown>`, because the worker has
 * no view of the app's schemas at the type level. The schema in src/schemas is
 * what actually guarantees the shape, so this is the single place that states
 * it, rather than a cast at every call site.
 */
function fieldsOf<T>(data: unknown): T {
  const record = (data as { record?: { data?: unknown } } | null)?.record
  return (record?.data ?? {}) as T
}
