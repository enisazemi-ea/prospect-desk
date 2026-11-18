import { useState } from 'react'
import { useMutations } from 'deepspace'
import { ExternalLink, Mail, RotateCw } from 'lucide-react'
import { Badge, Button, useToast } from '@/components/ui'
import { callAction } from '@/lib/call-action'
import { overallScore } from '@/lib/prospect-score'
import type { Prospect } from '@/lib/records'
import type { ProspectStatus } from '@/schemas/prospects-schema'

/**
 * One candidate site, as a card you can decide about without leaving the page.
 *
 * The layout follows the order the decision is actually made in: what the site
 * is, how strong it is, whether it fits, what you would say, and who you would
 * say it to. The score sits in the corner as a large numeral because it is the
 * thing the eye should land on first when scanning twenty of these.
 *
 * That numeral combines the topical fit with the domain's authority, and the
 * two parts stay visible in the row underneath. Nobody should have to take a
 * single number on trust when the inputs are right there.
 */
export function ProspectCard({ id, prospect }: { id: string; prospect: Prospect }) {
  const { put } = useMutations<Prospect>('prospects')
  const { error } = useToast()
  const [reviewing, setReviewing] = useState(false)

  const reviewed = prospect.reviewState === 'done'
  const running = prospect.reviewState === 'running' || reviewing

  async function review() {
    setReviewing(true)
    try {
      await callAction('reviewProspect', { prospectId: id })
    } catch (e) {
      error('Review failed', e instanceof Error ? e.message : undefined)
    } finally {
      setReviewing(false)
    }
  }

  function setStatus(status: ProspectStatus) {
    put(id, { status })
  }

  return (
    <article className="rounded border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <a
            href={prospect.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 font-display text-xl font-semibold hover:underline"
          >
            {prospect.domain}
            <ExternalLink className="size-3.5 text-muted-foreground" />
          </a>

          {prospect.pageTitle && (
            <p className="mt-1 text-sm font-medium">{prospect.pageTitle}</p>
          )}

          {prospect.pageSummary && (
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              {prospect.pageSummary}
            </p>
          )}
        </div>

        <OverallScore
          score={overallScore(prospect.fitScore, prospect.domainRank)}
          running={running}
        />
      </div>

      {reviewed && (
        <>
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 border-t border-border pt-4 text-sm">
            <Metric label="Topical fit" value={prospect.fitScore} />
            <Metric label="Domain rank" value={prospect.domainRank} />
            <Metric label="Referring domains" value={prospect.referringDomains} />
            <Metric label="Backlinks" value={prospect.backlinks} />
          </dl>

          {prospect.fitReason && (
            <p className="mt-4 text-sm">
              <span className="text-muted-foreground">Why: </span>
              {prospect.fitReason}
            </p>
          )}

          {prospect.pitchAngle && (
            <p className="mt-2 text-sm">
              <span className="text-muted-foreground">Angle: </span>
              {prospect.pitchAngle}
            </p>
          )}
        </>
      )}

      {prospect.reviewState === 'failed' && (
        <p className="mt-4 border-t border-border pt-4 text-sm text-destructive">
          {prospect.reviewError || 'The review did not finish.'}
        </p>
      )}

      <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <StatusBadge status={prospect.status} />

          {prospect.contactEmail ? (
            <a
              href={`mailto:${prospect.contactEmail}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              <Mail className="size-3.5" />
              {prospect.contactEmail}
            </a>
          ) : (
            reviewed && <span className="text-sm text-muted-foreground">No contact found</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="ghost" loading={running} onClick={review}>
            <RotateCw className="size-3.5" />
            {reviewed ? 'Review again' : 'Review'}
          </Button>

          {prospect.status !== 'shortlisted' && (
            <Button size="sm" variant="secondary" onClick={() => setStatus('shortlisted')}>
              Shortlist
            </Button>
          )}
          {prospect.status === 'shortlisted' && (
            <Button size="sm" onClick={() => setStatus('contacted')}>
              Mark contacted
            </Button>
          )}
          {prospect.status !== 'rejected' && (
            <Button size="sm" variant="ghost" onClick={() => setStatus('rejected')}>
              Reject
            </Button>
          )}
          {prospect.status === 'rejected' && (
            <Button size="sm" variant="ghost" onClick={() => setStatus('new')}>
              Put back
            </Button>
          )}
        </div>
      </footer>
    </article>
  )
}

/** The large numeral in the corner. Unscored prospects show a dash, not a zero. */
function OverallScore({ score, running }: { score?: number; running: boolean }) {
  if (running) {
    return (
      <div className="shrink-0 text-right">
        <div className="h-12 w-16 animate-pulse rounded bg-muted" />
        <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">scoring</p>
      </div>
    )
  }

  const hasScore = typeof score === 'number'

  return (
    <div className="shrink-0 text-right">
      <p
        className={
          hasScore
            ? 'font-display text-5xl font-semibold leading-none tabular-nums text-primary'
            : 'font-display text-5xl font-semibold leading-none text-muted-foreground'
        }
      >
        {hasScore ? score : '—'}
      </p>
      <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">score</p>
    </div>
  )
}

function Metric({ label, value }: { label: string; value?: number }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">
        {typeof value === 'number' ? value.toLocaleString() : '—'}
      </dd>
    </div>
  )
}

const STATUS_LABELS: Record<ProspectStatus, string> = {
  new: 'To review',
  shortlisted: 'Shortlisted',
  contacted: 'Contacted',
  rejected: 'Rejected',
}

function StatusBadge({ status }: { status: ProspectStatus }) {
  const variant =
    status === 'shortlisted' ? 'default'
    : status === 'contacted' ? 'success'
    : status === 'rejected' ? 'outline'
    : 'secondary'

  return (
    <Badge variant={variant} size="sm">
      {STATUS_LABELS[status]}
    </Badge>
  )
}
