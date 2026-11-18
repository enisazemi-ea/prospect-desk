/** App name — replaced by the CLI during scaffolding. This is the deployment
 *  slug, so it stays lowercase and hyphenated; APP_TITLE is what people read. */
export const APP_NAME = 'prospect-desk'

/** The product's name as it appears in the interface and in search results. */
export const APP_TITLE = 'Prospect Desk'

/** One sentence, used in the nav, the landing page head tags and link previews. */
export const APP_TAGLINE =
  'A shared board for deciding which sites a link building campaign should pitch.'

/** Immutable app identity — data scope keys to this, so renames never
 *  strand your records.
 *
 *  Injected by the build from `DEEPSPACE_APP_ID` in the wrangler config this
 *  build is running against — `deepspaceBuild()` in vite.config.ts supplies the
 *  define (see `deepspace/build`). wrangler.toml is the only source of truth,
 *  so `deepspace dev start`, `vite build`, and `deepspace deploy --env <name>`
 *  each get their own environment's id — not a copy frozen at scaffold time.
 *  Do not replace this with a literal: that is how a staging browser ends up
 *  reading production's rooms. */
declare const __DEEPSPACE_APP_ID__: string
export const APP_ID: string = __DEEPSPACE_APP_ID__

/** Primary scope ID for the app's RecordRoom DO */
export const SCOPE_ID = `app:${APP_ID}`

/** Roles and display config — imported from SDK (single source of truth) */
export { ROLES, ROLE_CONFIG, type Role } from 'deepspace'
