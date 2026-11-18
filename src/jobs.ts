/**
 * Background-job handler, invoked by AppJobRoom for every job picked up from
 * the queue.
 *
 * Reviews run here rather than inside the request that asked for them. One
 * review is four third-party calls and takes the better part of a minute, so
 * a board of forty pasted urls would otherwise mean forty minutes of held
 * connections and a browser tab nobody can close. Enqueued instead, the cards
 * fill themselves in as each job finishes, and closing the tab costs nothing.
 */

import type { Job, JobContext } from 'deepspace/worker'
import type { Env } from '../worker'
import { runReview, type ReviewRequest } from './server/review-prospect'

export async function runJob(job: Job, ctx: JobContext, env: Env): Promise<void> {
  if (job.type === 'review-prospect') {
    const request = job.payload as unknown as ReviewRequest

    ctx.progress(0.1, `reading ${request.domain}`)
    await runReview(env, request)
    ctx.progress(1, `reviewed ${request.domain}`)
    return
  }

  throw new Error(`Unknown job type: ${job.type}`)
}
