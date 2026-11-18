/**
 * Theme catalog.
 *
 * Newsprint is the app's theme and lives in the @theme block in
 * src/styles.css, so it is what renders with no attribute set. Desk at night
 * is the one alternate and lives in src/themes.css as a [data-theme] block.
 *
 * Color values live in those two files. This one is metadata: the typed id
 * list, the labels shown in the interface, and the lookup helpers.
 */

export const THEMES = [
  {
    id: 'newsprint',
    label: 'Newsprint',
    description: 'Ink on warm paper. The default, built for long reading sessions in daylight.',
  },
  {
    id: 'desk-night',
    label: 'Desk at night',
    description: 'The same palette inverted, for working a list after dark.',
  },
] as const

export type ThemeId = (typeof THEMES)[number]['id']

/** Read the currently active theme id from <html data-theme>. */
export function getActiveTheme(): ThemeId {
  if (typeof document === 'undefined') return 'newsprint'
  const id = document.documentElement.getAttribute('data-theme') as ThemeId | null
  return id ?? 'newsprint'
}

/** Look up a theme entry by id, or fall back to the first theme. */
export function getTheme(id: string) {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}
