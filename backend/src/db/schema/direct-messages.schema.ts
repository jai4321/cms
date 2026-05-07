import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { workspaces } from './workspaces.schema';

export const directMessageConversations = pgTable(
  'direct_message_conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
);

export const dmParticipants = pgTable('dm_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => directMessageConversations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export type DirectMessageConversation =
  typeof directMessageConversations.$inferSelect;
export type NewDirectMessageConversation =
  typeof directMessageConversations.$inferInsert;
export type DmParticipant = typeof dmParticipants.$inferSelect;
export type NewDmParticipant = typeof dmParticipants.$inferInsert;
