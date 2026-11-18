import { buildCronContext } from 'deepspace/worker'
import type { Env } from '../../worker'
import {
  findContactEmail,
  readBacklinkProfile,
  readPage,
  scoreFit,
} from './prospect-research'

/**
 * Everything the review needs, captured when the job was enqueued.
 *
 * The job carries these rather than reading them back, which keeps it to four
 * provider calls and one write. A url and a domain do not change, and the
 * campaign topic at the moment somebody pressed review is the one they meant.
 */
export interface ReviewRequest {
  prospectId: string
  url: string
  domain: string
  topic: string
  clientSite: string
}

/**
 * Run one prospect's review and write the result onto its record.
 *
 * This runs as the app owner, which is what makes the integration calls
 * owner-billed and the write possible from a background job. The board is
 * watching the record, so each card fills itself in as its job finishes;
 * nothing polls and nobody waits on an open request.
 */
export async function runReview(env: Env, request: ReviewRequest): Promise<void> {
  const ctx = buildCronContext(env, env.OWNER_USER_ID, `app:${env.DEEPSPACE_APP_ID}`)
  const call = ctx.integrations.call

  try {
    const page = await readPage(call, request.url)
    const profile = await readBacklinkProfile(call, request.domain)
    const judgement = await scoreFit(call, {
      topic: request.topic,
      clientSite: request.clientSite,
      url: request.url,
      page,
    })

    // The contact lookup is the one step allowed to come back empty. A site
    // worth pitching with no address on file is still worth shortlisting.
    const contactEmail = await findContactEmail(call, request.domain)

    await ctx.records.update('prospects', request.prospectId, {
      pageTitle: page.title,
      pageSummary: page.summary,
      referringDomains: profile.referringDomains,
      backlinks: profile.backlinks,
      domainRank: profile.domainRank,
      fitScore: judgement.score,
      fitReason: judgement.reason,
      pitchAngle: judgement.angle,
      contactEmail: contactEmail ?? '',
      reviewState: 'done',
      reviewError: '',
      reviewedAt: new Date().toISOString(),
    })
  } catch (failure) {
    // Record why it failed on the card itself. Three failures in a list of
    // twenty is normal, and those three need to explain themselves without
    // anyone opening a log.
    const reason = failure instanceof Error ? failure.message : 'The review did not finish.'

    await ctx.records.update('prospects', request.prospectId, {
      reviewState: 'failed',
      reviewError: reason,
    })

    // Rethrow so the job is recorded as failed rather than quietly succeeding.
    throw failure
  }
}
