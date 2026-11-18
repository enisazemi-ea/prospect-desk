# Prospect Desk

A shared board for deciding which sites a link building campaign should pitch.

Live: https://prospect-desk.app.space

## The problem

Link building starts with a list of candidate sites. For each one somebody has
to open the page, work out what the site actually covers, check whether the
domain is worth a link at all, judge whether it is relevant enough to the
client, find a human to email, and think of an angle. That is a spreadsheet
plus ten browser tabs per row. Two people working the same list duplicate each
other, and the expensive version of that mistake is both of them emailing the
same site.

I have done this job for four years. Every field on a prospect card is one I
have actually needed. The ones I left out are ones I have watched people
collect and never use.

## What it does

A campaign holds one client and one topic. You paste candidate urls into it,
and each becomes a prospect card. Pressing review queues a job per prospect,
and the job:

1. reads the page with Firecrawl, main content only
2. pulls the domain's backlink profile from DataForSEO
3. scores topical fit against the campaign topic with Claude, and drafts a
   pitch angle
4. looks for a contact address at the domain with Anymail Finder

The card then shows one score, both of its inputs, the reasoning, the angle
and the contact. The team works the board from there: shortlist, reject, mark
contacted. Records sync, so two people on the same campaign see each other's
decisions as they land, and a presence line names whoever else has the board
open.

## The score

```
score = fit^0.65 × rank^0.35
```

Topical fit and domain rank multiply rather than average, because a link is
only worth having when both are true. A perfectly relevant page on a site
nobody links to passes almost nothing along. A large site writing about
something unrelated passes along something nobody wanted. An average hides a
near-zero on one side; a product does not.

Fit carries the larger exponent because the asymmetry is real. An irrelevant
link is worth nothing at any domain rank, while a relevant link on a smaller
site is still worth having. Two cases from the tests: a domain rank of 90
cannot carry a fit of 10, and a fit of 95 cannot carry a domain rank of 3.

The score is derived rather than stored, so changing the weighting does not
mean re-running a review that costs four provider calls.

## Integrations, and the ones I left out

Four are used, each for something the card would otherwise be missing:

| Integration | Why it is here |
|---|---|
| `firecrawl/scrape` | The review has to be about the page, not the domain name. `onlyMainContent` drops navigation and footers, which otherwise make every site on a template look alike to the scorer. |
| `dataforseo/backlinks-summary` | The authority numbers are what a link builder judges a site on before reading a word of it. |
| `anthropic/chat-completion` | Topical fit, the reasoning behind it, and the pitch angle. Haiku rather than a larger model: a short judgement over one page, run once per prospect across lists of hundreds. |
| `anymailfinder/find-company` | A shortlist you cannot act on is a list. It only bills when it finds an address. |

Deliberately not used:

- **Search (`exa/search`, `firecrawl/search`).** Finding prospects is a
  different product from deciding about them. This one starts from the list
  you already have, and adding discovery would have made it worse at the thing
  it is for.
- **`email/send`.** The app drafts the angle and a person sends it. Outreach
  sent from a shared application address is outreach nobody replies to, and
  automating the send is the part of this job that should stay manual.
- **`prospeo/*`.** It overlaps Anymail Finder. Two contact providers would be
  two bills and one feature.
- **The rest of DataForSEO.** It has twenty endpoints. Nineteen of them would
  be numbers on a card that nobody uses to make this decision.

## The main tradeoff

Four provider calls per prospect, so that one card answers the whole question.

The alternative was a cheap triage pass: fetch the title, score on that, and
only spend the rest on prospects that survive. That scales to thousands of
urls for a fraction of the cost. I chose the opposite because the job this
replaces is reading the page, and a score from a title is the same guess the
spreadsheet was already making. The cost shows up as a per-prospect bill and
as roughly half a minute per card, which is why reviews run as background jobs
rather than inside the request.

If this had to handle lists of a thousand, I would add the cheap pass in front
and keep the full review for whatever clears it.

## How it is built

A DeepSpace app on Cloudflare Workers.

- `src/schemas/` — two collections, campaigns and prospects. Members read and
  edit every prospect in a campaign, because two people working one list is
  the normal case. Prospects are unique on `(campaignId, url)`, because
  overlapping pasted lists are the rule.
- `src/actions/` — `reviewProspect` authorizes the caller, marks the card
  running and enqueues a job. `loadSampleCampaign` seeds a new desk.
- `src/jobs.ts` and `src/server/` — the review itself. Four calls and one
  write, as the app owner.
- `src/config.ts` — every tunable that decides what a review costs.
- `src/lib/prospect-score.ts` — the score, with its reasoning next to it.

Two things worth knowing if you are reading the code:

**The action tools bypass per-record permissions.** The role check at the top
of `reviewProspect` is the app's own and it has to be. Without it any
signed-in visitor could spend the owner's integration budget one paste at a
time.

**Provider payloads are read defensively.** The platform's envelope nests the
answer under `data` for one endpoint and `result` for another, and a Claude
reply can open with a block that is not text. Each reader takes what it needs
and returns undefined for the rest, rather than trusting a path and throwing
on a response that is merely shaped differently. Both of those were found by
running it, not by reading the schemas.

## What is unfinished

- **Reviews go stale.** There is no scheduled re-review, so a profile pulled
  today is the one you see in March. A cron task per campaign is the obvious
  next thing.
- **The contact is a company address, not an editor.** `find-decision-maker`
  exists and would be better, but its role categories do not map well to
  blogs, so it would need its own judgement pass.
- **The scorer reads one page, not the site.** A good site with a weak page
  scores like a weak site.
- **No export.** A shortlist leaves this app by copy and paste.
- **No pagination.** A board of a thousand prospects renders a thousand cards.

## Running it

```sh
npm install
npx deepspace auth login
npx deepspace dev start     # http://localhost:5173
npx deepspace test          # smoke and API suites
npm run type-check
npm run test:unit           # the url parser and the score
npx deepspace deploy
```
