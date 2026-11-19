/**
 * Scheduled tasks, registered into the AppCronRoom at construction time.
 *
 * There is one: an overnight pass that re-reviews prospects whose last review
 * has gone stale. The reasoning and the cost cap live in
 * src/server/refresh-stale-reviews.ts, next to the code they govern.
 */

import type { CronTask } from 'deepspace/worker'
import type { Env } from '../worker'
import { REFRESH } from './config'
import { refreshStaleReviews } from './server/refresh-stale-reviews'

export const tasks: CronTask[] = [
  {
    name: 'refresh-stale-reviews',
    schedule: REFRESH.schedule,
    timezone: REFRESH.timezone,
  },
]

export async function runTask(name: string, env: Env): Promise<void> {
  if (name === 'refresh-stale-reviews') {
    const queued = await refreshStaleReviews(env)
    console.log(`[cron] refresh-stale-reviews queued ${queued} reviews`)
    return
  }

  throw new Error(`Unknown cron task: ${name}`)
}
