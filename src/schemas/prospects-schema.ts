import type { CollectionSchema } from 'deepspace/schema'

/** The decision a prospect is at. This is the column the board sorts by. */
export const PROSPECT_STATUSES = [
  'new',
  'shortlisted',
  'contacted',
  'rejected',
] as const

export type ProspectStatus = (typeof PROSPECT_STATUSES)[number]

/** Where the automated review has got to for this prospect. */
export const REVIEW_STATES = ['pending', 'running', 'done', 'failed'] as const

export type ReviewState = (typeof REVIEW_STATES)[number]

/**
 * One candidate site in a campaign.
 *
 * Everything from `pageTitle` down is filled in by the review pipeline in
 * src/actions/review-prospect.ts. A prospect that has only a url and a domain
 * has simply not been reviewed yet, which is why none of those fields are
 * treated as required anywhere in the interface.
 */
export const prospectsSchema: CollectionSchema = {
  name: 'prospects',
  columns: [
    { name: 'campaignId', storage: 'text', interpretation: { kind: 'reference', targetTable: 'campaigns', displayColumn: 'name' } },
    { name: 'url', storage: 'text', interpretation: { kind: 'url' } },
    { name: 'domain', storage: 'text', interpretation: 'plain' },

    // Filled in from the scraped page.
    { name: 'pageTitle', storage: 'text', interpretation: 'plain' },
    { name: 'pageSummary', storage: 'text', interpretation: 'plain' },

    // Filled in from the backlink profile.
    { name: 'referringDomains', storage: 'number', interpretation: 'plain' },
    { name: 'backlinks', storage: 'number', interpretation: 'plain' },
    { name: 'domainRank', storage: 'number', interpretation: 'plain' },

    // Filled in by the scoring pass.
    { name: 'fitScore', storage: 'number', interpretation: { kind: 'percent', decimals: 0 } },
    { name: 'fitReason', storage: 'text', interpretation: 'plain' },
    { name: 'pitchAngle', storage: 'text', interpretation: 'plain' },

    // Filled in by the contact lookup.
    { name: 'contactEmail', storage: 'text', interpretation: { kind: 'email' } },

    // Worked by the team.
    { name: 'status', storage: 'text', interpretation: { kind: 'select', options: [...PROSPECT_STATUSES] } },

    // Pipeline bookkeeping. `reviewError` holds the message from whichever
    // step failed, so a failed card can explain itself instead of just
    // sitting there empty.
    { name: 'reviewState', storage: 'text', interpretation: { kind: 'select', options: [...REVIEW_STATES] } },
    { name: 'reviewError', storage: 'text', interpretation: 'plain' },
    { name: 'reviewedAt', storage: 'text', interpretation: { kind: 'datetime' } },
  ],
  // The same url should not appear twice in one campaign. Two people pasting
  // overlapping lists into the same board is the normal case, not the edge.
  uniqueOn: ['campaignId', 'url'],
  permissions: {
    viewer: { read: true, create: false, update: false, delete: false },
    member: { read: true, create: true, update: true, delete: true },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
