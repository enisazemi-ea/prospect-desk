import { USERS_COLUMNS, type CollectionSchema } from 'deepspace/schema'

export const usersSchema: CollectionSchema = {
  name: 'users',
  columns: [...USERS_COLUMNS],
  // Everyone who signs in can work a board. Stated here rather than left to
  // the platform default, because the review action turns members away and a
  // silent change to that default would lock every new person out of the one
  // thing the app does.
  defaultRole: 'member',
  permissions: {
    viewer: { read: 'own', create: false, update: 'own', delete: false },
    member: { read: 'own', create: false, update: 'own', delete: false },
    admin: { read: true, create: false, update: true, delete: true },
  },
}
