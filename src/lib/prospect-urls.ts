/**
 * Turning a pasted block of text into a clean list of prospect urls.
 *
 * People paste from everywhere: a spreadsheet column, an email, a Slack
 * message, an export with a trailing comma on every line. The parsing here is
 * deliberately forgiving about what arrives and strict about what comes out.
 */

/** Strip a url down to the bare hostname, with no scheme, port, or www. */
export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/**
 * Read one pasted line as a url.
 *
 * Returns null when the line cannot be made into an http url, so the caller
 * can drop it rather than storing something that will fail at scrape time.
 * A bare domain like `example.com/blog` is accepted and gets https added.
 */
export function parseProspectUrl(line: string): string | null {
  const trimmed = line.trim().replace(/[,;]+$/, '')
  if (!trimmed) return null

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  let parsed: URL
  try {
    parsed = new URL(withScheme)
  } catch {
    return null
  }

  // A hostname with no dot is a typo, not a site.
  if (!parsed.hostname.includes('.')) return null

  return parsed.toString()
}

/**
 * Read a pasted block into a de-duplicated list of urls.
 *
 * Splits on newlines, commas and whitespace, because every source formats a
 * list differently and none of them agree.
 */
export function parseProspectList(input: string): string[] {
  const seen = new Set<string>()
  const urls: string[] = []

  for (const line of input.split(/[\n\r,\s]+/)) {
    const url = parseProspectUrl(line)
    if (!url || seen.has(url)) continue
    seen.add(url)
    urls.push(url)
  }

  return urls
}
