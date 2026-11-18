import type { ActionHandler } from 'deepspace/worker'
import type { Env } from '../../worker'
import { domainOf } from '../lib/prospect-urls'

/**
 * Put a campaign on a new desk so the first screen is the product.
 *
 * Someone signing in for the first time lands on an empty list, which shows
 * them nothing about whether the tool is worth their afternoon. This creates
 * one campaign with four real candidate pages waiting to be reviewed, so the
 * first thing they can do is press review and watch the pipeline work on
 * pages they can open themselves.
 *
 * The client is invented. The candidate pages are real, because a sample made
 * of invented domains would prove nothing about whether any of this works,
 * and because inventing backlink numbers for real sites would be worse than
 * showing none.
 */
export const loadSampleCampaign: ActionHandler<Env> = async ({ tools, userId }) => {
  const caller = await tools.get('users', userId)
  if (!caller.success) return caller

  const role = (caller.data as { record?: { data?: { role?: string } } })?.record?.data?.role
  if (role !== 'member' && role !== 'admin') {
    return { success: false, error: 'Only members of this desk can load the sample.' }
  }

  // One sample per person. Pressing the button twice should not leave two
  // identical campaigns on the list.
  const existing = await tools.query('campaigns', { where: { name: SAMPLE.name }, limit: 1 })
  if (existing.success) {
    const rows = (existing.data as { records?: Array<{ recordId: string }> }).records ?? []
    if (rows.length > 0) {
      return { success: true, data: { campaignId: rows[0].recordId, created: false } }
    }
  }

  // The id is generated here rather than read back out of the create result,
  // so the prospects below can reference the campaign without a second round
  // trip or an assumption about the response shape.
  const campaignId = crypto.randomUUID()

  const campaign = await tools.create(
    'campaigns',
    {
      name: SAMPLE.name,
      clientSite: SAMPLE.clientSite,
      topic: SAMPLE.topic,
      notes: SAMPLE.notes,
    },
    campaignId,
  )
  if (!campaign.success) return campaign

  for (const url of SAMPLE.prospectUrls) {
    const created = await tools.create('prospects', {
      campaignId,
      url,
      domain: domainOf(url),
      status: 'new',
      reviewState: 'pending',
    })
    if (!created.success) return created
  }

  return { success: true, data: { campaignId, created: true } }
}

/**
 * The sample itself.
 *
 * Cedar Creek is invented. The four pages are real and public, and they were
 * chosen to spread across the range: one squarely on topic, one adjacent, one
 * written for the opposite kind of seller, and one about moving rather than
 * selling. A sample where everything scores well would teach a new reader
 * nothing about what the number means.
 */
const SAMPLE = {
  name: 'Cedar Creek Home Buyers, Houston',
  clientSite: 'cedarcreekhomebuyers.example',
  topic:
    'Buys houses for cash in Houston, Texas, closing in days with no repairs, no agent fees and no showings',
  notes: 'Sample campaign. The client is invented; the candidate pages are real.',
  prospectUrls: [
    'https://listwithclever.com/real-estate-blog/average-time-to-sell-a-house-in-houston/',
    'https://www.houstonproperties.com/sell-houston-house/tips-for-selling-your-home',
    'https://www.sparefoot.com/blog/how-to-downsize-your-home-quickly-and-still-keep-your-sanity',
    'https://www.sparefoot.com/blog/5-awesome-reasons-to-downsize-your-home',
  ],
} as const
