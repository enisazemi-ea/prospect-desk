/**
 * Integration Billing Config
 *
 * Configure who pays for each integration's API calls.
 *
 * - 'developer': The app owner pays (default).
 * - 'user': The calling user pays.
 *
 * Every integration requires a signed-in caller. Set `anonymous: true` on a
 * 'developer' integration to let signed-out visitors call it too — the owner
 * then pays for anyone who can reach the app.
 *
 * Integrations not listed here default to 'developer' with sign-in required.
 *
 * IMPORTANT: any integration backed by per-user connected accounts (Google,
 * Composio) must be 'user' — the api-worker resolves the account from the
 * JWT subject. With 'developer' the app owner's JWT is forwarded, so every
 * signed-in user connects and acts on the app owner's account. Server code
 * that acts for a user in the background (e.g. a cron job) uses
 * `callComposio(env, ..., { asUser })` from 'deepspace/worker' instead.
 */

export const integrations: Record<
  string,
  { billing: 'developer' | 'user'; anonymous?: boolean }
> = {
  google: { billing: 'user' },
  composio: { billing: 'user' },

  // The four providers a prospect review is made of. All owner-billed,
  // because a review is the app's work and the result belongs to the whole
  // board rather than to whoever happened to press the button. None of them
  // allow anonymous callers: a signed-out visitor who could run a review
  // could run the owner's bill up one paste at a time.
  firecrawl: { billing: 'developer' },
  dataforseo: { billing: 'developer' },
  anthropic: { billing: 'developer' },
  anymailfinder: { billing: 'developer' },
}
