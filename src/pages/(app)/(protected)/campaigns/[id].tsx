import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from 'deepspace'
import { ArrowLeft, Inbox } from 'lucide-react'
import { Button, EmptyState, Tabs, TabsList, TabsTrigger, useToast } from '@/components/ui'
import { AddProspects } from '@/components/prospects/AddProspects'
import { ProspectCard } from '@/components/prospects/ProspectCard'
import { WhoIsHere } from '@/components/prospects/WhoIsHere'
import { callAction } from '@/lib/call-action'
import type { Campaign, Prospect } from '@/lib/records'
import { PROSPECT_STATUSES, type ProspectStatus } from '@/schemas/prospects-schema'

type Filter = 'all' | ProspectStatus

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All',
  new: 'To review',
  shortlisted: 'Shortlisted',
  contacted: 'Contacted',
  rejected: 'Rejected',
}

export default function CampaignBoardPage() {
  const { id = '' } = useParams<{ id: string }>()
  const campaigns = useQuery<Campaign>('campaigns')
  const prospects = useQuery<Prospect>('prospects', { where: { campaignId: id } })
  const { success, error } = useToast()

  const [filter, setFilter] = useState<Filter>('all')
  const [reviewingAll, setReviewingAll] = useState(false)

  const campaign = campaigns.records.find((record) => record.recordId === id)

  // Newest first, because the rows someone just pasted are the rows they are
  // about to work on.
  const rows = useMemo(
    () =>
      [...prospects.records].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [prospects.records],
  )

  const visible = filter === 'all' ? rows : rows.filter((row) => row.data.status === filter)
  const unreviewed = rows.filter((row) => row.data.reviewState !== 'done')
  const existingUrls = new Set(rows.map((row) => row.data.url))

  async function reviewEveryUnreviewed() {
    setReviewingAll(true)
    let queued = 0
    let refused = 0

    // Each call only enqueues a job, so this returns in about as long as the
    // requests take. The reviews themselves run in the background and the
    // cards fill in as each one lands.
    for (const row of unreviewed) {
      try {
        await callAction('reviewProspect', { prospectId: row.recordId })
        queued += 1
      } catch {
        refused += 1
      }
    }

    setReviewingAll(false)

    if (refused === 0) {
      success(
        `${queued} ${queued === 1 ? 'review' : 'reviews'} queued`,
        'The cards fill in as each one finishes. You can leave this page.',
      )
    } else {
      error(
        `${queued} queued, ${refused} refused`,
        'The cards that were refused say why, and can be retried one at a time.',
      )
    }
  }

  if (campaigns.status === 'loading') return <BoardSkeleton />

  if (!campaign) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24">
        <EmptyState
          title="That campaign is not here"
          description="It may have been deleted, or the link may be wrong."
          action={{ label: 'Back to campaigns', onClick: () => { window.location.href = '/home' } }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-full text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link
          to="/home"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          Campaigns
        </Link>

        <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight">
              {campaign.data.name}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">{campaign.data.topic}</p>
            <div className="mt-2">
              <WhoIsHere campaignId={id} />
            </div>
          </div>

          {unreviewed.length > 0 && (
            <Button loading={reviewingAll} onClick={reviewEveryUnreviewed}>
              Review {unreviewed.length} waiting
            </Button>
          )}
        </header>

        <div className="mt-8">
          <AddProspects campaignId={id} existingUrls={existingUrls} />
        </div>

        <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)} className="mt-8">
          <TabsList>
            {(['all', ...PROSPECT_STATUSES] as Filter[]).map((value) => (
              <TabsTrigger key={value} value={value}>
                {FILTER_LABELS[value]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <section className="mt-6 space-y-4">
          {prospects.status === 'loading' ? (
            <CardSkeletons />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={<Inbox />}
              title={rows.length === 0 ? 'No prospects yet' : 'Nothing under this filter'}
              description={
                rows.length === 0
                  ? 'Paste a list above and the desk will read each page and score it against the campaign topic.'
                  : 'Try another tab.'
              }
            />
          ) : (
            visible.map((row) => (
              <ProspectCard key={row.recordId} id={row.recordId} prospect={row.data} />
            ))
          )}
        </section>
      </div>
    </div>
  )
}

function BoardSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12" aria-hidden="true">
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-6 h-10 w-72 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-4 w-96 animate-pulse rounded bg-muted" />
      <div className="mt-10 h-40 animate-pulse rounded bg-muted" />
    </div>
  )
}

function CardSkeletons() {
  return (
    <div aria-hidden="true" className="space-y-4">
      {[0, 1, 2].map((card) => (
        <div key={card} className="rounded border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-6">
            <div className="w-full max-w-md space-y-2">
              <div className="h-6 w-56 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-12 w-16 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
