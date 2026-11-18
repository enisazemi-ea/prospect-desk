/**
 * The four outside calls a prospect review is made of.
 *
 * Each one is small, named after the question it answers, and returns a plain
 * object rather than the provider's envelope. Keeping them here leaves the
 * orchestration in review-prospect.ts readable as a sequence of steps.
 *
 * Every provider here answers with its own shape, and the platform passes that
 * payload through untyped. So each reader below takes the parts it needs
 * defensively and returns undefined for anything missing, rather than trusting
 * a path and throwing on a response that is merely shaped differently.
 */

import type { ActionTools } from 'deepspace/worker'

/** The one method these helpers need from the action context's `tools`. */
export type IntegrationCaller = Pick<ActionTools, 'integration'>

export interface PageContent {
  title: string
  summary: string
  /** The page as markdown, trimmed to what the scoring pass needs. */
  text: string
}

export interface BacklinkProfile {
  referringDomains?: number
  backlinks?: number
  domainRank?: number
}

export interface FitJudgement {
  score: number
  reason: string
  angle: string
}

/** How much of a scraped page to send to the scoring pass. */
const PAGE_CHARACTERS_FOR_SCORING = 6000

/**
 * Read the prospect page.
 *
 * `onlyMainContent` drops the navigation, cookie banners and footers, which
 * otherwise dominate a short post and make every site on a template look
 * alike to the scorer.
 */
export async function readPage(tools: IntegrationCaller, url: string): Promise<PageContent> {
  const response = await tools.integration('firecrawl/scrape', {
    url,
    formats: ['markdown'],
    onlyMainContent: true,
  })

  if (!response.success) {
    throw new Error(response.error ?? 'The page could not be read.')
  }

  const payload = unwrap(response.data)
  const metadata = asRecord(payload?.metadata)
  const markdown = typeof payload?.markdown === 'string' ? payload.markdown : ''

  if (markdown.trim() === '') {
    throw new Error('The page returned no readable text.')
  }

  return {
    title: asText(metadata?.title) ?? '',
    summary: asText(metadata?.description) ?? '',
    text: markdown.slice(0, PAGE_CHARACTERS_FOR_SCORING),
  }
}

/**
 * Look up the domain's backlink profile.
 *
 * This is the number a link builder judges a site on before reading a word of
 * it, so a missing profile is worth showing as missing rather than as zero.
 */
export async function readBacklinkProfile(
  tools: IntegrationCaller,
  domain: string,
): Promise<BacklinkProfile> {
  const response = await tools.integration('dataforseo/backlinks-summary', {
    target: domain,
    include_subdomains: true,
    backlinks_status_type: 'live',
    rank_scale: 'one_hundred',
  })

  if (!response.success) {
    throw new Error(response.error ?? 'The backlink profile could not be read.')
  }

  const summary = unwrap(response.data)

  return {
    referringDomains: asNumber(summary?.referring_domains),
    backlinks: asNumber(summary?.backlinks),
    domainRank: asNumber(summary?.rank),
  }
}

/**
 * Score the page against the campaign topic and draft an angle.
 *
 * Haiku rather than a larger model on purpose: this is a short judgement over
 * one page of text, and it runs once per prospect across lists of hundreds, so
 * the cost per card is the thing that matters.
 */
export async function scoreFit(
  tools: IntegrationCaller,
  input: { topic: string; clientSite: string; url: string; page: PageContent },
): Promise<FitJudgement> {
  const response = await tools.integration('anthropic/chat-completion', {
    model: 'claude-haiku-5-5',
    max_tokens: 700,
    temperature: 0.2,
    system: SCORING_INSTRUCTIONS,
    messages: [
      {
        role: 'user',
        content: [
          `Client site: ${input.clientSite || 'not given'}`,
          `What the client is about: ${input.topic}`,
          '',
          `Prospect page: ${input.url}`,
          `Prospect page title: ${input.page.title || 'not given'}`,
          '',
          'Prospect page content:',
          input.page.text,
        ].join('\n'),
      },
    ],
  })

  if (!response.success) {
    throw new Error(response.error ?? 'The page could not be scored.')
  }

  return readJudgement(response.data)
}

const SCORING_INSTRUCTIONS = [
  'You are helping a link building team decide whether a site is worth pitching.',
  '',
  'Judge topical fit between the prospect page and the client, and nothing else.',
  'Authority numbers are handled elsewhere, so ignore how big or small the site looks.',
  'A page that merely mentions the subject in passing is a weak fit.',
  'A page whose readers would plausibly want the client is a strong fit.',
  '',
  'Answer with a JSON object and no other text:',
  '{"score": <0-100>, "reason": "<one sentence>", "angle": "<one sentence>"}',
  '',
  'reason: why the score is what it is, naming what the page is actually about.',
  'angle: the specific thing to pitch this site, in the words you would use in',
  'the first line of the email. Say what would be useful to their readers, not',
  'what would be useful to the client.',
].join('\n')

/**
 * Find a contact address at the domain.
 *
 * Anymail Finder only charges when it finds a valid address, so an empty
 * answer here costs nothing and is a normal outcome rather than a failure.
 * A prospect with no contact is still worth shortlisting.
 */
export async function findContactEmail(
  tools: IntegrationCaller,
  domain: string,
): Promise<string | undefined> {
  const response = await tools.integration('anymailfinder/find-company', {
    domain,
    email_type: 'any',
  })

  if (!response.success) return undefined

  return firstEmailAt(response.data, domain)
}

/* -------------------------------------------------------------------------
 * Reading untyped provider payloads
 * ---------------------------------------------------------------------- */

/**
 * Take the provider's own payload out of the platform's envelope.
 *
 * The envelope is consistent in spirit and not in naming: some endpoints put
 * the provider's answer under `data` and others under `result`, alongside the
 * billing fields. A list of one is unwrapped too, which is how DataForSEO
 * answers a single-target request. Doing this once keeps every reader above
 * written against the provider's shape rather than the platform's.
 */
function unwrap(value: unknown): Record<string, unknown> | undefined {
  const envelope = asRecord(value)
  if (!envelope) return undefined

  const inner = envelope.data ?? envelope.result ?? envelope
  const unpacked = Array.isArray(inner) ? inner[0] : inner

  return asRecord(unpacked) ?? asRecord(envelope)
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function asText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value)
  }
  return undefined
}

/** Pull the model's JSON out of an Anthropic Messages response. */
function readJudgement(payload: unknown): FitJudgement {
  const message = unwrap(payload)
  const content = message?.content
  const firstBlock = Array.isArray(content) ? asRecord(content[0]) : undefined
  const text = asText(firstBlock?.text)

  if (!text) {
    // Name the keys that did arrive. A failed card is read by whoever is
    // adding the next integration, and "nothing to read" on its own sends
    // them to the logs for something the card could have told them.
    const keys = Object.keys(message ?? {}).join(', ') || 'none'
    throw new Error(`The scoring model returned nothing to read. Keys in the reply: ${keys}`)
  }

  // Models occasionally wrap JSON in a code fence or a sentence, so take the
  // outermost braces rather than parsing the whole reply.
  const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)

  let parsed: Record<string, unknown> | undefined
  try {
    parsed = asRecord(JSON.parse(json))
  } catch {
    throw new Error('The scoring model did not answer with JSON.')
  }

  const score = asNumber(parsed?.score)
  if (score === undefined) throw new Error('The scoring model returned no score.')

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    reason: asText(parsed?.reason) ?? '',
    angle: asText(parsed?.angle) ?? '',
  }
}

/**
 * Walk a response for the first address at the domain we asked about.
 *
 * The contact lookup answers with different shapes for a generic company
 * address and a named person's, and the platform passes the payload through
 * untyped. Rather than guessing which path applies, this looks for the answer
 * itself, which is the one thing that is the same either way.
 */
function firstEmailAt(payload: unknown, domain: string): string | undefined {
  const suffix = `@${domain.toLowerCase()}`
  const seen: unknown[] = [payload]

  while (seen.length > 0) {
    const value = seen.pop()

    if (typeof value === 'string') {
      const candidate = value.trim().toLowerCase()
      if (candidate.endsWith(suffix) && candidate.indexOf('@') === candidate.lastIndexOf('@')) {
        return candidate
      }
      continue
    }

    if (Array.isArray(value)) {
      seen.push(...value)
      continue
    }

    const record = asRecord(value)
    if (record) seen.push(...Object.values(record))
  }

  return undefined
}
