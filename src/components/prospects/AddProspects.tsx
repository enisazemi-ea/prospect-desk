import { useState } from 'react'
import { useMutations } from 'deepspace'
import { Button, Textarea, useToast } from '@/components/ui'
import { domainOf, parseProspectList } from '@/lib/prospect-urls'
import type { Prospect } from '@/lib/records'

/**
 * The paste box.
 *
 * People arrive with a column from a spreadsheet, a block from an email, or a
 * list a colleague sent in chat. Rather than a one-url-at-a-time form, this
 * takes the whole block, keeps what it can read, and says plainly how many
 * lines it threw away.
 */
export function AddProspects({
  campaignId,
  existingUrls,
}: {
  campaignId: string
  existingUrls: Set<string>
}) {
  const { ready, create } = useMutations<Prospect>('prospects')
  const { success, warning } = useToast()
  const [text, setText] = useState('')
  const [adding, setAdding] = useState(false)

  async function add() {
    const parsed = parseProspectList(text)
    const fresh = parsed.filter((url) => !existingUrls.has(url))

    if (fresh.length === 0) {
      warning(
        'Nothing to add',
        parsed.length === 0
          ? 'None of those lines read as a web address.'
          : 'Every one of those is already on this board.',
      )
      return
    }

    setAdding(true)
    try {
      for (const url of fresh) {
        create({
          campaignId,
          url,
          domain: domainOf(url),
          status: 'new',
          reviewState: 'pending',
        })
      }

      const skipped = parsed.length - fresh.length
      success(
        `Added ${fresh.length} ${fresh.length === 1 ? 'prospect' : 'prospects'}`,
        skipped > 0 ? `${skipped} were already on the board.` : undefined,
      )
      setText('')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="rounded border border-border bg-card p-4">
      <label htmlFor="paste-urls" className="font-display text-lg font-semibold">
        Add prospects
      </label>
      <p className="mt-1 text-sm text-muted-foreground">
        Paste a list. Newlines, commas and stray spaces all work, and anything already on the
        board is skipped.
      </p>

      <Textarea
        id="paste-urls"
        className="mt-3 min-h-28 font-mono text-xs"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'thriftyfamilyblog.com/posts/dentist-visit\nsacramentoparents.org/resources'}
      />

      <div className="mt-3 flex justify-end">
        <Button disabled={!ready || text.trim() === ''} loading={adding} onClick={add}>
          Add to board
        </Button>
      </div>
    </div>
  )
}
