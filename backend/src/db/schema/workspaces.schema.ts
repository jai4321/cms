import {
  pgTable,
  uuid,
  varchar,
  pgEnum,
  timestamp,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const workspaceRoleEnum = pgEnum('workspace_role', [
  'owner',
  'admin',
  'member',
]);

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  iconUrl: varchar('icon_url', { length: 512 }),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const workspaceMembers = pgTable('workspace_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: workspaceRoleEnum('role').notNull().default('member'),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert;
export type WorkspaceRole = 'owner' | 'admin' | 'member';
