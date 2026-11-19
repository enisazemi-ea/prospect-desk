import { buildCronContext, enqueueJob } from 'deepspace/worker'
import type { Env } from '../../worker'
import { REFRESH } from '../config'
import type { ReviewRequest } from './review-prospect'

interface Envelope<T> {
  recordId: string
  data: T
}

interface CampaignFields {
  topic?: string
  clientSite?: string
}

interface ProspectFields {
  campaignId?: string
  url?: string
  domain?: string
  status?: string
  reviewState?: string
  reviewedAt?: string
}

/**
 * Re-review the prospects whose last review has gone stale.
 *
 * A backlink profile pulled in January is not the same profile in March, and
 * a page that was on topic can be rewritten or taken down. Left alone, a board
 * quietly becomes a record of what was true the day somebody pasted it, which
 * is the worst kind of wrong: it still looks current.
 *
 * Two rules keep this from being expensive. Rejected prospects are skipped,
 * because nobody is going to pitch them whatever the numbers say now. And the
 * run is capped, oldest first, so the cost of a night is a number someone
 * chose rather than a function of how many urls were pasted that month.
 *
 * Returns how many were queued, which is what the task logs.
 */
export async function refreshStaleReviews(env: Env): Promise<number> {
  const ctx = buildCronContext(env, env.OWNER_USER_ID, `app:${env.DEEPSPACE_APP_ID}`)

  const campaigns = (await ctx.records.query('campaigns', {
    limit: 500,
  })) as Envelope<CampaignFields>[]

  const topics = new Map(campaigns.map((row) => [row.recordId, row.data]))

  const prospects = (await ctx.records.query('prospects', {
    limit: 5000,
  })) as Envelope<ProspectFields>[]

  const cutoff = Date.now() - REFRESH.staleAfterDays * 24 * 60 * 60 * 1000

  const stale = prospects
    .filter((row) => isStale(row.data, cutoff) && topics.has(row.data.campaignId ?? ''))
    // Oldest first, so a capped run always works on the worst of it.
    .sort((a, b) => reviewedAtMs(a.data) - reviewedAtMs(b.data))
    .slice(0, REFRESH.maxPerRun)

  for (const row of stale) {
    const campaign = topics.get(row.data.campaignId ?? '')

    const request: ReviewRequest = {
      prospectId: row.recordId,
      url: row.data.url ?? '',
      domain: row.data.domain ?? '',
      topic: campaign?.topic ?? '',
      clientSite: campaign?.clientSite ?? '',
    }

    // Mark it running before enqueuing, so anyone who opens the board mid-run
    // sees a card being worked on rather than one that silently changes.
    await ctx.records.update('prospects', row.recordId, {
      reviewState: 'running',
      reviewError: '',
    })

    await enqueueJob(
      env.JOB_ROOMS,
      `app:${env.DEEPSPACE_APP_ID}`,
      'review-prospect',
      request as unknown as Record<string, unknown>,
      { maxAttempts: 1, enqueuedBy: env.OWNER_USER_ID },
    )
  }

  return stale.length
}

/** A finished review, not rejected, and older than the staleness window. */
function isStale(prospect: ProspectFields, cutoff: number): boolean {
  if (prospect.reviewState !== 'done') return false

  // Nobody is going to pitch a rejected site whatever the numbers say now, so
  // refreshing one is four provider calls spent on a decision already made.
  if (prospect.status === 'rejected') return false

  if (!prospect.url || !prospect.domain) return false

  return reviewedAtMs(prospect) < cutoff
}

/**
 * When this prospect was last reviewed, as a timestamp.
 *
 * A done review with no date is treated as infinitely old rather than skipped.
 * It is a row from before this field existed, and those are exactly the ones
 * most worth running again.
 */
function reviewedAtMs(prospect: ProspectFields): number {
  if (!prospect.reviewedAt) return 0

  const parsed = Date.parse(prospect.reviewedAt)
  return Number.isNaN(parsed) ? 0 : parsed
}
