import type { CollectionSchema } from 'deepspace/schema'

/**
 * A campaign is one client and one topic.
 *
 * Every prospect belongs to a campaign, and the campaign's topic is what each
 * prospect gets scored against. Keeping the topic here rather than on the
 * prospect is what lets one person add a hundred URLs without restating what
 * the client is about a hundred times.
 */
export const campaignsSchema: CollectionSchema = {
  name: 'campaigns',
  columns: [
    { name: 'name', storage: 'text', interpretation: 'plain' },
    { name: 'clientSite', storage: 'text', interpretation: { kind: 'url' } },
    { name: 'topic', storage: 'text', interpretation: 'plain' },
    { name: 'notes', storage: 'text', interpretation: 'plain' },
  ],
  permissions: {
    // A campaign is shared work, so any member can open one and edit it.
    // Deleting is left with whoever created it, to keep one person from
    // wiping a colleague's list.
    viewer: { read: true, create: false, update: false, delete: false },
    member: { read: true, create: true, update: true, delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
