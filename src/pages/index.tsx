/**
 * Landing page — a STATIC page.
 *
 * It lives at the top level of src/pages/ (not under (app)/), so it renders
 * with no DeepSpace providers: no auth session fetch, no records WebSocket.
 * Top-level pages are prerendered to static HTML at build, so this has to
 * render without a browser: no window or document during render, prose in
 * HTML text, and motion in CSS keyframes rather than JavaScript.
 *
 * DESIGN DIRECTION
 *
 * 1. Product: a shared board where a link building team decides which sites
 *    are worth pitching.
 * 2. Emotion: the relief of a cluttered desk being cleared. Calm, decisive,
 *    the feeling of a pile turning into a shortlist.
 * 3. Visual metaphor: a sorting table in a newsroom. Paper triaged into keep
 *    and discard piles, each sheet marked by hand.
 * 4. References from outside this industry: a chef's mise en place station,
 *    an airport departure board, a library card catalogue.
 * 5. Signature element: the fit score set as a large numeral in the corner of
 *    a card, the way a grade is stamped on paper.
 * 6. Hero visual: three prospect cards settling into place on load, each one
 *    landing with its score already on it.
 *
 * STYLE TILE
 *
 * Color: near-black ink on warm paper, one burnt-orange signal reserved for
 *   the score and the primary action. Low saturation, 60-30-10.
 * Type pair: Fraunces for headlines, Inter for body. The job is reading pages
 *   and judging them, so the page reads like print rather than a console.
 * Theme: light. Long sessions, daylight, a lot of text.
 * Art direction: editorial. Rules instead of boxes, generous measure, numbers
 *   set large.
 * Motion: subtle drift. Cards settle once and then hold still.
 * Voice: names the decision rather than the feature; no sentence over twelve
 *   words; never opens with "we".
 */

import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { APP_TITLE } from '../constants'
import { seo } from '../seo'

export default function Landing() {
  return (
    <>
      <Seo {...seo} path="/" />

      <div data-testid="static-landing" className="min-h-screen">
        <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <span className="font-display text-base font-semibold uppercase tracking-[0.18em]">
            {APP_TITLE}
          </span>
          <Link
            to="/home"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Open the desk
          </Link>
        </header>

        <main className="mx-auto max-w-5xl px-6">
          <section className="grid items-center gap-12 border-t border-border py-16 lg:grid-cols-[1fr_auto] lg:py-24">
            <div>
              <h1 className="max-w-xl font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
                Decide which sites deserve the pitch
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
                Paste the candidates for a campaign. Each one comes back read, scored against your
                client, and addressed to a person.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/home"
                  className="inline-flex h-11 items-center rounded bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Open the desk
                </Link>
                <span className="text-sm text-muted-foreground">
                  Built on the DeepSpace SDK
                </span>
              </div>
            </div>

            <SortingTable />
          </section>

          <section className="border-t border-border py-16">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              What happens to a pasted url
            </h2>

            <ol className="mt-10 grid gap-10 sm:grid-cols-2">
              <Step
                number="01"
                heading="The page gets read"
                body="Not the domain name. The article itself, stripped of navigation and footers."
              />
              <Step
                number="02"
                heading="The profile gets pulled"
                body="Referring domains, backlinks and rank, so strength is a number rather than a hunch."
              />
              <Step
                number="03"
                heading="The fit gets scored"
                body="Against the one sentence describing your client, with the reasoning written out."
              />
              <Step
                number="04"
                heading="A contact gets found"
                body="An address at that domain, so the shortlist is something you can act on today."
              />
            </ol>
          </section>

          <section className="border-t border-border py-16">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <p className="max-w-md font-display text-2xl font-semibold leading-snug">
                Two people on the same list see each other working it.
              </p>
              <Link
                to="/home"
                className="inline-flex h-11 items-center rounded bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Start a campaign
              </Link>
            </div>
          </section>
        </main>

        <footer className="border-t border-border">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-6 py-8 text-sm text-muted-foreground">
            <span>{APP_TITLE}</span>
            <span>Link building, with the reading already done</span>
          </div>
        </footer>
      </div>
    </>
  )
}

/**
 * The hero visual: three cards settling onto the table, each already marked
 * with its score. Built in markup rather than as an image so it carries the
 * theme and stays sharp at any size.
 */
function SortingTable() {
  const cards = [
    { domain: 'sacramentoparents.org', score: 86, verdict: 'Shortlist' },
    { domain: 'thriftyfamilyblog.com', score: 61, verdict: 'Maybe' },
    { domain: 'seo-guest-posts.net', score: 12, verdict: 'Reject' },
  ]

  return (
    <div aria-hidden="true" className="w-full max-w-sm space-y-3 lg:w-80">
      {cards.map((card, index) => (
        <div
          key={card.domain}
          className="card-settles flex items-center justify-between gap-4 rounded border border-border bg-card px-5 py-4"
          style={{ animationDelay: `${index * 110}ms` }}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{card.domain}</p>
            <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">
              {card.verdict}
            </p>
          </div>
          <p className="font-display text-4xl font-semibold leading-none tabular-nums text-primary">
            {card.score}
          </p>
        </div>
      ))}
    </div>
  )
}

function Step({ number, heading, body }: { number: string; heading: string; body: string }) {
  return (
    <li className="border-t border-border pt-5">
      <p className="font-display text-sm font-semibold tabular-nums text-primary">{number}</p>
      <h3 className="mt-2 font-display text-xl font-semibold">{heading}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{body}</p>
    </li>
  )
}
