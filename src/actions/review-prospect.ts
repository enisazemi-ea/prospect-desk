import type { ActionHandler } from 'deepspace/worker'
import type { Env } from '../../worker'
import type { Prospect } from '../lib/records'
import { findContactEmail, readBacklinkProfile, readPage, scoreFit } from './prospect-research'

/**
 * Review one prospect.
 *
 * Reads the page, looks up the backlink profile, scores the fit against the
 * campaign topic, and finds a contact. The board watches the record, so each
 * write here lands on every open board without the client polling for it.
 *
 * This runs on the server rather than in the browser for two reasons: the
 * integration calls are billed to the app, and the result has to be the same
 * for everyone looking at the board rather than living in one person's tab.
 *
 * Note that the tools an action is handed reach the record room with per-record
 * permissions switched off, so nothing below is authorized by the schema. The
 * role check is this action's own, and it has to be: without it any signed-in
 * visitor could spend the owner's integration budget one paste at a time.
 */
export const reviewProspect: ActionHandler<Env> = async ({ params, tools, userId }) => {
  const prospectId = params.prospectId
  if (typeof prospectId !== 'string' || prospectId === '') {
    return { success: false, error: 'prospectId is required.' }
  }

  const caller = await tools.get('users', userId)
  if (!caller.success) return caller

  const role = (caller.data as { record: { data: { role?: string } } }).record.data.role
  if (role !== 'member' && role !== 'admin') {
    return { success: false, error: 'Only members of this desk can run a review.' }
  }

  const found = await tools.get('prospects', prospectId)
  if (!found.success) return found

  const prospect = (found.data as { record: { data: Prospect } }).record.data

  const campaign = await tools.get('campaigns', prospect.campaignId)
  if (!campaign.success) return campaign

  const { topic, clientSite } = (
    campaign.data as { record: { data: { topic: string; clientSite: string } } }
  ).record.data

  // Flip the card into its running state first, so anyone else on the board
  // can see the review is already under way and does not start it again.
  await tools.update('prospects', prospectId, { reviewState: 'running', reviewError: '' })

  try {
    const page = await readPage(tools, prospect.url)
    const profile = await readBacklinkProfile(tools, prospect.domain)
    const judgement = await scoreFit(tools, {
      topic,
      clientSite,
      url: prospect.url,
      page,
    })

    // The contact lookup is the one step allowed to come back empty: a site
    // worth pitching with no address on file is still worth shortlisting.
    const contactEmail = await findContactEmail(tools, prospect.domain)

    return tools.update('prospects', prospectId, {
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
    // Record why it failed on the card itself. A list of twenty prospects
    // where three failed is normal, and the three need to explain themselves
    // without anyone opening a log.
    const reason = failure instanceof Error ? failure.message : 'The review did not finish.'

    await tools.update('prospects', prospectId, {
      reviewState: 'failed',
      reviewError: reason,
    })

    return { success: false, error: reason }
  }
}
