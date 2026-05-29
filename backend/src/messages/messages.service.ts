import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { eq, and, lt, desc, isNull, inArray } from 'drizzle-orm';
import { DRIZZLE } from '../db/drizzle.module';
import type { DrizzleClient } from '../db/drizzle.client';
import {
  messages,
  threadMessages,
  reactions,
  mentions,
  users,
  dmParticipants,
} from '../db/schema';
import { PostReplyDto, AddReactionDto, GetRepliesDto } from './dto/messages.dto';

@Injectable()
export class MessagesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleClient) {}

  // ─── Verify the user has access to a message (is DM participant) ─────────────

  async verifyAccess(messageId: string, userId: string): Promise<typeof messages.$inferSelect> {
    const [message] = await this.db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!message) throw new NotFoundException('Message not found');

    const [participant] = await this.db
      .select()
      .from(dmParticipants)
      .where(
        and(
          eq(dmParticipants.conversationId, message.conversationId),
          eq(dmParticipants.userId, userId),
        ),
      )
      .limit(1);

    if (!participant) throw new ForbiddenException('Access denied');
    return message;
  }

  // ─── Thread Replies ───────────────────────────────────────────────────────────

  async postReply(messageId: string, senderId: string, dto: PostReplyDto) {
    const [reply] = await this.db
      .insert(threadMessages)
      .values({
        parentMessageId: messageId,
        senderId,
        content: dto.content,
      })
      .returning();

    const sender = await this.db
      .select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, senderId))
      .limit(1);

    return { ...reply, sender: sender[0] };
  }

  async getReplies(messageId: string, query: GetRepliesDto) {
    const limit = query.limit ?? 50;
    const conditions = [
      eq(messages.replyToMessageId, messageId),
      isNull(messages.deletedAt),
    ];

    if (query.before) {
      conditions.push(lt(messages.createdAt, new Date(query.before)));
    }

    const rows = await this.db
      .select({
        id: messages.id,
        parentMessageId: messages.replyToMessageId,
        content: messages.content,
        editedAt: messages.editedAt,
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
      .limit(limit);

    return rows.reverse().map((r) => ({ ...r, parentMessageId: messageId }));
  }

  async getReplyCount(messageId: string): Promise<number> {
    const rows = await this.db
      .select({ id: threadMessages.id })
      .from(threadMessages)
      .where(
        and(
          eq(threadMessages.parentMessageId, messageId),
          isNull(threadMessages.deletedAt),
        ),
      );
    return rows.length;
  }

  // ─── Reactions ────────────────────────────────────────────────────────────────

  async addReaction(messageId: string, userId: string, dto: AddReactionDto) {
    try {
      const [reaction] = await this.db
        .insert(reactions)
        .values({ messageId, userId, emoji: dto.emoji })
        .returning();
      return reaction;
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code === '23505') {
        // Unique violation — already reacted
        throw new ConflictException('Already reacted with this emoji');
      }
      throw err;
    }
  }

  async removeReaction(messageId: string, userId: string, emoji: string) {
    const [deleted] = await this.db
      .delete(reactions)
      .where(
        and(
          eq(reactions.messageId, messageId),
          eq(reactions.userId, userId),
          eq(reactions.emoji, emoji),
        ),
      )
      .returning();

    if (!deleted) throw new NotFoundException('Reaction not found');
    return { removed: true };
  }

  async getReactions(messageId: string) {
    return this.db
      .select({
        id: reactions.id,
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
      .where(eq(reactions.messageId, messageId))
      .orderBy(reactions.createdAt);
  }

  // ─── Mentions ─────────────────────────────────────────────────────────────────

  /**
   * Parse @username tokens from message content.
   * Returns array of user IDs found (that exist in DB).
   */
  async parseMentions(content: string): Promise<string[]> {
    const pattern = /@([a-zA-Z0-9_]+)/g;
    const usernames = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(content)) !== null) {
      usernames.add(match[1].toLowerCase());
    }

    if (usernames.size === 0) return [];

    const rows = await this.db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(inArray(users.username, [...usernames]));

    return rows.map((r) => r.id);
  }

  async saveMentions(messageId: string, mentionedUserIds: string[]) {
    if (mentionedUserIds.length === 0) return;
    await this.db.insert(mentions).values(
      mentionedUserIds.map((uid) => ({ messageId, mentionedUserId: uid })),
    );
  }
}
