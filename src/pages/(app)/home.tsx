/* home pattern: data-forward — the campaign list above the fold, with the counts that decide where the afternoon goes */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthOverlay, useAuth, useMutations, useQuery } from 'deepspace'
import { FolderOpen } from 'lucide-react'
import { Button, EmptyState, Input, Label, Modal, useToast } from '@/components/ui'
import { callAction } from '@/lib/call-action'
import type { Campaign, Prospect } from '@/lib/records'

export default function HomePage() {
  const { isSignedIn } = useAuth()
  const campaigns = useQuery<Campaign>('campaigns', { orderBy: 'createdAt', orderDir: 'desc' })
  const prospects = useQuery<Prospect>('prospects')
  const [isCreating, setIsCreating] = useState(false)
  const [showSignIn, setShowSignIn] = useState(false)
  const [loadingSample, setLoadingSample] = useState(false)
  const navigate = useNavigate()
  const { error } = useToast()

  // A first-time visitor should be able to see the product work before
  // deciding to type anything into it, so the empty state offers a campaign
  // with real candidate pages already in it.
  async function loadSample() {
    setLoadingSample(true)
    try {
      const { campaignId } = await callAction<{ campaignId: string }>('loadSampleCampaign')
      navigate(`/campaigns/${campaignId}`)
    } catch (e) {
      error('Could not load the sample', e instanceof Error ? e.message : undefined)
    } finally {
      setLoadingSample(false)
    }
  }

  const loading = campaigns.status === 'loading'

  return (
    <div className="min-h-full text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="font-display text-5xl font-semibold tracking-tight">Prospect desk</h1>
            <p className="mt-3 max-w-xl text-base text-muted-foreground">
              Paste the candidate sites for a campaign and the desk reads each page, scores it
              against the client topic, and finds someone to write to.
            </p>
          </div>

          {isSignedIn ? (
            <Button onClick={() => setIsCreating(true)}>New campaign</Button>
          ) : (
            <Button onClick={() => setShowSignIn(true)}>Sign in to start a campaign</Button>
          )}
        </header>

        <section className="mt-12">
          {loading ? (
            <CampaignListSkeleton />
          ) : campaigns.records.length === 0 && !isSignedIn ? (
            <SampleBoard onSignIn={() => setShowSignIn(true)} />
          ) : campaigns.records.length === 0 ? (
            <EmptyState
              icon={<FolderOpen />}
              title="No campaigns yet"
              description="A campaign is one client and one topic. Everything you paste into it gets scored against that topic. If you would rather see it working first, the sample arrives with four real candidate pages waiting to be reviewed."
              action={{ label: 'New campaign', onClick: () => setIsCreating(true) }}
              secondaryAction={{
                label: loadingSample ? 'Loading sample…' : 'Load a sample campaign',
                onClick: loadSample,
              }}
            />
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {campaigns.records.map((campaign) => (
                <CampaignRow
                  key={campaign.recordId}
                  id={campaign.recordId}
                  campaign={campaign.data}
                  prospects={prospects.records
                    .filter((p) => p.data.campaignId === campaign.recordId)
                    .map((p) => p.data)}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      {isCreating && <NewCampaignDialog onClose={() => setIsCreating(false)} />}
      {showSignIn && <AuthOverlay onClose={() => setShowSignIn(false)} />}
    </div>
  )
}

function CampaignRow({
  id,
  campaign,
  prospects,
}: {
  id: string
  campaign: Campaign
  prospects: Prospect[]
}) {
  const waiting = prospects.filter((p) => p.status === 'new').length
  const shortlisted = prospects.filter((p) => p.status === 'shortlisted').length

  return (
    <li>
      <Link
        to={`/campaigns/${id}`}
        className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 py-5 transition-colors hover:bg-accent/60"
      >
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold">{campaign.name}</h2>
          <p className="mt-1 truncate text-sm text-muted-foreground">{campaign.topic}</p>
        </div>

        <dl className="flex shrink-0 items-baseline gap-6 text-sm">
          <Count label="prospects" value={prospects.length} />
          <Count label="to review" value={waiting} />
          <Count label="shortlisted" value={shortlisted} />
        </dl>
      </Link>
    </li>
  )
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-right">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-display text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  )
}

/**
 * What a signed-out visitor sees.
 *
 * An empty page with a sign-in button tells someone nothing about whether the
 * tool is worth signing in for. These are two made-up campaigns in the exact
 * shape of real ones, labelled as examples so nobody mistakes them for data.
 */
function SampleBoard({ onSignIn }: { onSignIn: () => void }) {
  const examples = [
    { name: 'Riverside Dental, spring links', topic: 'Family dentistry and orthodontics in Sacramento', total: 48, waiting: 9, shortlisted: 14 },
    { name: 'Northvale Outdoors, Q1', topic: 'Hiking and camping gear for cold weather', total: 112, waiting: 0, shortlisted: 31 },
  ]

  return (
    <div>
      <p className="mb-4 text-xs uppercase tracking-wide text-muted-foreground">
        An example of what a desk looks like
      </p>

      <ul className="divide-y divide-border border-y border-border opacity-70">
        {examples.map((example) => (
          <li
            key={example.name}
            className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 py-5"
          >
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold">{example.name}</h2>
              <p className="mt-1 truncate text-sm text-muted-foreground">{example.topic}</p>
            </div>
            <dl className="flex shrink-0 items-baseline gap-6 text-sm">
              <Count label="prospects" value={example.total} />
              <Count label="to review" value={example.waiting} />
              <Count label="shortlisted" value={example.shortlisted} />
            </dl>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center gap-4">
        <Button onClick={onSignIn}>Sign in to start a campaign</Button>
        <p className="text-sm text-muted-foreground">Your campaigns are private to your desk.</p>
      </div>
    </div>
  )
}

/** Matches the shape of the real rows, so the page does not jump when they land. */
function CampaignListSkeleton() {
  return (
    <ul aria-hidden="true" className="divide-y divide-border border-y border-border">
      {[0, 1, 2].map((row) => (
        <li key={row} className="flex items-center justify-between gap-8 py-6">
          <div className="w-full max-w-sm space-y-2">
            <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        </li>
      ))}
    </ul>
  )
}

function NewCampaignDialog({ onClose }: { onClose: () => void }) {
  const { ready, createConfirmed } = useMutations<Campaign>('campaigns')
  const { success, error } = useToast()
  const [name, setName] = useState('')
  const [clientSite, setClientSite] = useState('')
  const [topic, setTopic] = useState('')
  const [saving, setSaving] = useState(false)

  const canSave = ready && name.trim() !== '' && topic.trim() !== ''

  async function save() {
    setSaving(true)
    try {
      await createConfirmed({
        name: name.trim(),
        clientSite: clientSite.trim(),
        topic: topic.trim(),
        notes: '',
      })
      success('Campaign created', `${name.trim()} is ready for prospects.`)
      onClose()
    } catch (e) {
      error('Could not create the campaign', e instanceof Error ? e.message : undefined)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose}>
      <Modal.Header>
        <Modal.Title>New campaign</Modal.Title>
      </Modal.Header>

      <Modal.Body className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="campaign-name">Campaign</Label>
          <Input
            id="campaign-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Riverside Dental, spring links"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="campaign-site">Client site</Label>
          <Input
            id="campaign-site"
            value={clientSite}
            onChange={(e) => setClientSite(e.target.value)}
            placeholder="riversidedental.com"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="campaign-topic">What the client is about</Label>
          <Input
            id="campaign-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Family dentistry and orthodontics in Sacramento"
          />
          <p className="text-xs text-muted-foreground">
            Every prospect in this campaign is scored against this sentence, so write it the way
            you would explain the client to a stranger.
          </p>
        </div>

      </Modal.Body>

      <Modal.Footer>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!canSave} loading={saving} onClick={save}>
          Create campaign
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
