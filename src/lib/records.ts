import type { ProspectStatus, ReviewState } from '@/schemas/prospects-schema'

/**
 * The shapes the record hooks read and write.
 *
 * These mirror the collections in src/schemas/. Fields the review pipeline
 * fills in are optional here, because a prospect exists from the moment
 * someone pastes a url and only grows the rest later.
 */

export interface Campaign {
  name: string
  clientSite: string
  topic: string
  notes: string
}

export interface Prospect {
  campaignId: string
  url: string
  domain: string
  status: ProspectStatus
  reviewState: ReviewState

  pageTitle?: string
  pageSummary?: string

  referringDomains?: number
  backlinks?: number
  domainRank?: number

  fitScore?: number
  fitReason?: string
  pitchAngle?: string

  contactEmail?: string

  reviewError?: string
  reviewedAt?: string
}
