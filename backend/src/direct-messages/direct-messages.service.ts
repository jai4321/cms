import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, inArray, lt, desc, isNull } from 'drizzle-orm';
import { DRIZZLE } from '../db/drizzle.module';
import type { DrizzleClient } from '../db/drizzle.client';
import {
  directMessageConversations,
  dmParticipants,
  workspaceMembers,
  users,
  messages,
  mentions,
  attachments,
  reactions,
} from '../db/schema';
import {
  CreateDmDto,
  AddParticipantDto,
  RenameGroupDto,
  SendMessageDto,
  GetMessagesDto,
} from './dto/direct-message.dto';

@Injectable()
export class DirectMessagesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleClient) {}

  // ─── Find or create DM conversation ─────────────────────────────────────────

  async findOrCreate(
    workspaceId: string,
    currentUserId: string,
    dto: CreateDmDto,
  ) {
    const allUserIds = [...new Set([currentUserId, ...dto.userIds])];
    const targetCount = allUserIds.length;

    // Get all conversation IDs where the current user is a participant in this workspace
    const myConversations = await this.db
      .select({
        conversationId: dmParticipants.conversationId,
      })
      .from(dmParticipants)
      .innerJoin(
        directMessageConversations,
        eq(dmParticipants.conversationId, directMessageConversations.id),
      )
      .where(
        and(
          eq(dmParticipants.userId, currentUserId),
          eq(directMessageConversations.workspaceId, workspaceId),
        ),
      );

    const myConvoIds = myConversations.map((r) => r.conversationId);

    if (myConvoIds.length > 0) {
      // Load participants for all candidate conversations
      const allParticipants = await this.db
        .select({
          conversationId: dmParticipants.conversationId,
          userId: dmParticipants.userId,
        })
        .from(dmParticipants)
        .where(inArray(dmParticipants.conversationId, myConvoIds));

      // Group by conversationId
      const byConvo = new Map<string, string[]>();
      for (const row of allParticipants) {
        const list = byConvo.get(row.conversationId) ?? [];
        list.push(row.userId);
        byConvo.set(row.conversationId, list);
      }

      // Find conversation with exactly matching participant set
      for (const [convoId, participants] of byConvo.entries()) {
        if (participants.length !== targetCount) continue;
        const sorted = [...participants].sort();
        const targetSorted = [...allUserIds].sort();
        if (sorted.every((id, i) => id === targetSorted[i])) {
          return this.getConversation(convoId);
        }
      }
    }

    // Create new conversation
    const [conversation] = await this.db
      .insert(directMessageConversations)
      .values({
        workspaceId,
        name: dto.name ?? null,
        createdBy: currentUserId,
      })
      .returning();

    await this.db.insert(dmParticipants).values(
      allUserIds.map((userId) => ({
        conversationId: conversation.id,
        userId,
      })),
    );

    return this.getConversation(conversation.id);
  }

  // ─── Rename group DM ──────────────────────────────────────────────────────────

  async renameGroup(
    conversationId: string,
    dto: RenameGroupDto,
    requestingUserId: string,
  ) {
    const [conversation] = await this.db
      .select()
      .from(directMessageConversations)
      .where(eq(directMessageConversations.id, conversationId))
      .limit(1);

    if (!conversation) throw new NotFoundException('Conversation not found');

    // Allow if creator OR workspace admin/owner
    const isCreator = conversation.createdBy === requestingUserId;
    if (!isCreator) {
      const [membership] = await this.db
        .select({ role: workspaceMembers.role })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, conversation.workspaceId),
            eq(workspaceMembers.userId, requestingUserId),
          ),
        )
        .limit(1);

      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        throw new ForbiddenException(
          'Only the creator or an admin can rename this group',
        );
      }
    }

    const [updated] = await this.db
      .update(directMessageConversations)
      .set({ name: dto.name })
      .where(eq(directMessageConversations.id, conversationId))
      .returning();

    return updated;
  }

  // ─── Leave group DM ───────────────────────────────────────────────────────────

  async leaveGroup(conversationId: string, userId: string) {
    await this.db
      .delete(dmParticipants)
      .where(
        and(
          eq(dmParticipants.conversationId, conversationId),
          eq(dmParticipants.userId, userId),
        ),
      );

    // If no participants remain, delete the conversation
    const remaining = await this.db
      .select({ id: dmParticipants.id })
      .from(dmParticipants)
      .where(eq(dmParticipants.conversationId, conversationId))
      .limit(1);

    if (remaining.length === 0) {
      await this.db
        .delete(directMessageConversations)
        .where(eq(directMessageConversations.id, conversationId));
    }

    return { success: true };
  }

  // ─── Get single conversation with participants ─────────────────────────────────

  async getConversation(conversationId: string) {
    const [conversation] = await this.db
      .select()
      .from(directMessageConversations)
      .where(eq(directMessageConversations.id, conversationId))
      .limit(1);

    if (!conversation) throw new NotFoundException('Conversation not found');

    const participantRows = await this.db
      .select({
        userId: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(dmParticipants)
      .innerJoin(users, eq(dmParticipants.userId, users.id))
      .where(eq(dmParticipants.conversationId, conversationId));

    return { ...conversation, participants: participantRows };
  }

  // ─── List DM conversations for user in a workspace ───────────────────────────

  async listForUser(workspaceId: string, currentUserId: string) {
    // Get all conversations the user is part of in this workspace
    const rows = await this.db
      .select({
        conversationId: dmParticipants.conversationId,
      })
      .from(dmParticipants)
      .innerJoin(
        directMessageConversations,
        eq(dmParticipants.conversationId, directMessageConversations.id),
      )
      .where(
        and(
          eq(dmParticipants.userId, currentUserId),
          eq(directMessageConversations.workspaceId, workspaceId),
        ),
      );

    if (rows.length === 0) return [];

    const convoIds = rows.map((r) => r.conversationId);

    // Load all conversations + their participants with user info
    const conversations = await this.db
      .select()
      .from(directMessageConversations)
      .where(inArray(directMessageConversations.id, convoIds));

    const participantRows = await this.db
      .select({
        conversationId: dmParticipants.conversationId,
        userId: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(dmParticipants)
      .innerJoin(users, eq(dmParticipants.userId, users.id))
      .where(inArray(dmParticipants.conversationId, convoIds));

    // Group participants by conversationId
    const participantsByConvo = new Map<
      string,
      { userId: string; username: string; avatarUrl: string | null }[]
    >();
    for (const row of participantRows) {
      const list = participantsByConvo.get(row.conversationId) ?? [];
      list.push({
        userId: row.userId,
        username: row.username,
        avatarUrl: row.avatarUrl,
      });
      participantsByConvo.set(row.conversationId, list);
    }

    return conversations.map((c) => ({
      ...c,
      participants: participantsByConvo.get(c.id) ?? [],
    }));
  }

  // ─── Add participant to group DM ─────────────────────────────────────────────

  async addParticipant(conversationId: string, dto: AddParticipantDto) {
    // Check conversation exists
    const [conversation] = await this.db
      .select()
      .from(directMessageConversations)
      .where(eq(directMessageConversations.id, conversationId))
      .limit(1);

    if (!conversation) throw new NotFoundException('Conversation not found');

    // Check not already a participant
    const existing = await this.db
      .select()
      .from(dmParticipants)
      .where(
        and(
          eq(dmParticipants.conversationId, conversationId),
          eq(dmParticipants.userId, dto.userId),
        ),
      )
      .limit(1);

    if (existing.length) {
      throw new ConflictException('User is already a participant');
    }

    const [participant] = await this.db
      .insert(dmParticipants)
      .values({ conversationId, userId: dto.userId })
      .returning();

    return participant;
  }

  // ─── List participants ────────────────────────────────────────────────────────

  async listParticipants(conversationId: string) {
    const rows = await this.db
      .select({
        id: dmParticipants.id,
        userId: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
        joinedAt: dmParticipants.joinedAt,
      })
      .from(dmParticipants)
      .innerJoin(users, eq(dmParticipants.userId, users.id))
      .where(eq(dmParticipants.conversationId, conversationId));

    return rows;
  }

  // ─── Parse @username mentions from content ──────────────────────────────────

  async parseMentionUserIds(content: string): Promise<string[]> {
    const pattern = /@([a-zA-Z0-9_]+)/g;
    const usernames = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      usernames.add(match[1].toLowerCase());
    }
    if (usernames.size === 0) return [];
    const rows = await this.db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.username, [...usernames]));
    return rows.map((r) => r.id);
  }

  // ─── Send a message ───────────────────────────────────────────────────────────

  async sendMessage(
    conversationId: string,
    senderId: string,
    dto: SendMessageDto,
  ) {
    const [message] = await this.db
      .insert(messages)
      .values({
        conversationId,
        senderId,
        content: dto.content,
        replyToMessageId: dto.replyToMessageId ?? null,
      })
      .returning();

    const [sender] = await this.db
      .select({
        id: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, senderId))
      .limit(1);

    // Parse and save @mentions
    const mentionedUserIds = await this.parseMentionUserIds(dto.content);
    if (mentionedUserIds.length > 0) {
      await this.db
        .insert(mentions)
        .values(
          mentionedUserIds.map((uid) => ({
            messageId: message.id,
            mentionedUserId: uid,
          })),
        )
        .onConflictDoNothing();
    }

    // Link provided attachments to this message
    if (dto.attachmentIds && dto.attachmentIds.length > 0) {
      await this.db
        .update(attachments)
        .set({ messageId: message.id })
        .where(
          and(
            inArray(attachments.id, dto.attachmentIds),
            eq(attachments.uploaderId, senderId),
          ),
        );
    }

    // Fetch linked attachments
    const linkedAttachments =
      dto.attachmentIds && dto.attachmentIds.length > 0
        ? await this.db
            .select()
            .from(attachments)
            .where(eq(attachments.messageId, message.id))
        : [];

    // Fetch the quoted (replied-to) message if present
    let replyTo: {
      id: string;
      content: string;
      sender: { id: string; username: string; avatarUrl: string | null };
    } | null = null;
    if (dto.replyToMessageId) {
      const [quoted] = await this.db
        .select({
          id: messages.id,
          content: messages.content,
          sender: {
            id: users.id,
            username: users.username,
            avatarUrl: users.avatarUrl,
          },
        })
        .from(messages)
        .innerJoin(users, eq(messages.senderId, users.id))
        .where(eq(messages.id, dto.replyToMessageId))
        .limit(1);
      replyTo = quoted ?? null;
    }

    return {
      ...message,
      sender,
      mentionedUserIds,
      attachments: linkedAttachments,
      replyTo,
    };
  }

  // ─── Get message by ID (with sender) ─────────────────────────────────────────

  async getMessageById(messageId: string) {
    const [row] = await this.db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        content: messages.content,
        editedAt: messages.editedAt,
        deletedAt: messages.deletedAt,
        createdAt: messages.createdAt,
        sender: {
          id: users.id,
          username: users.username,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.id, messageId))
      .limit(1);
    return row ?? null;
  }

  // ─── Paginated message history ────────────────────────────────────────────────

  async getMessages(conversationId: string, dto: GetMessagesDto) {
    const limit = dto.limit ?? 50;

    const conditions = [
      eq(messages.conversationId, conversationId),
      isNull(messages.deletedAt),
    ];

    if (dto.cursor) {
      // Cursor is a message createdAt timestamp encoded as ISO string via the message id
      // We use message id as cursor (UUID v4 has no ordering) so we use createdAt
      // Strategy: fetch message by cursor id to get its createdAt, then fetch older
      const [cursorMsg] = await this.db
        .select({ createdAt: messages.createdAt })
        .from(messages)
        .where(eq(messages.id, dto.cursor))
        .limit(1);

      if (cursorMsg) {
        conditions.push(lt(messages.createdAt, cursorMsg.createdAt));
      }
    }

    const rows = await this.db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        content: messages.content,
        replyToMessageId: messages.replyToMessageId,
        editedAt: messages.editedAt,
        deletedAt: messages.deletedAt,
        createdAt: messages.createdAt,
        sender: {
          id: users.id,
          username: users.username,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Fetch attachments for these messages
    const messageIds = items.map((m) => m.id);
    const attachmentRows =
      messageIds.length > 0
        ? await this.db
            .select()
            .from(attachments)
            .where(inArray(attachments.messageId, messageIds))
        : [];

    // Group attachments by messageId
    const attachmentsByMessage = new Map<
      string,
      (typeof attachments.$inferSelect)[]
    >();
    for (const att of attachmentRows) {
      if (!att.messageId) continue;
      const list = attachmentsByMessage.get(att.messageId) ?? [];
      list.push(att);
      attachmentsByMessage.set(att.messageId, list);
    }

    const itemsWithAttachments = items.map((m) => ({
      ...m,
      attachments: attachmentsByMessage.get(m.id) ?? [],
    }));

    // Batch-fetch replyTo messages
    const replyToIds = items
      .map((m) => m.replyToMessageId)
      .filter((id): id is string => !!id);

    const replyToMap = new Map<
      string,
      {
        id: string;
        content: string;
        sender: { id: string; username: string; avatarUrl: string | null };
      }
    >();
    if (replyToIds.length > 0) {
      const quotedRows = await this.db
        .select({
          id: messages.id,
          content: messages.content,
          sender: {
            id: users.id,
            username: users.username,
            avatarUrl: users.avatarUrl,
          },
        })
        .from(messages)
        .innerJoin(users, eq(messages.senderId, users.id))
        .where(inArray(messages.id, replyToIds));
      for (const row of quotedRows) {
        replyToMap.set(row.id, row);
      }
    }

    // Batch-fetch reactions for all messages
    const reactionRows =
      messageIds.length > 0
        ? await this.db
            .select({
              id: reactions.id,
              messageId: reactions.messageId,
              emoji: reactions.emoji,
              createdAt: reactions.createdAt,
              user: {
                id: users.id,
                username: users.username,
                avatarUrl: users.avatarUrl,
              },
            })
            .from(reactions)
            .innerJoin(users, eq(reactions.userId, users.id))
            .where(inArray(reactions.messageId, messageIds))
        : [];

    const reactionsByMessage = new Map<string, typeof reactionRows>();
    for (const r of reactionRows) {
      const list = reactionsByMessage.get(r.messageId) ?? [];
      list.push(r);
      reactionsByMessage.set(r.messageId, list);
    }

    const itemsWithAll = itemsWithAttachments.map((m) => ({
      ...m,
      replyTo: m.replyToMessageId
        ? (replyToMap.get(m.replyToMessageId) ?? null)
        : null,
      reactions: reactionsByMessage.get(m.id) ?? [],
    }));

    return { items: itemsWithAll, nextCursor, hasMore };
  }
}
