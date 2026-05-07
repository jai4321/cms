import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { eq, and, inArray } from 'drizzle-orm';
import { DRIZZLE } from '../db/drizzle.module';
import type { DrizzleClient } from '../db/drizzle.client';
import {
  directMessageConversations,
  dmParticipants,
  users,
} from '../db/schema';
import { CreateDmDto, AddParticipantDto } from './dto/direct-message.dto';

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
        eq(
          dmParticipants.conversationId,
          directMessageConversations.id,
        ),
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
          const [existing] = await this.db
            .select()
            .from(directMessageConversations)
            .where(eq(directMessageConversations.id, convoId))
            .limit(1);
          return existing;
        }
      }
    }

    // Create new conversation
    const [conversation] = await this.db
      .insert(directMessageConversations)
      .values({ workspaceId })
      .returning();

    await this.db.insert(dmParticipants).values(
      allUserIds.map((userId) => ({
        conversationId: conversation.id,
        userId,
      })),
    );

    return conversation;
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
        eq(
          dmParticipants.conversationId,
          directMessageConversations.id,
        ),
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

  async addParticipant(
    conversationId: string,
    dto: AddParticipantDto,
  ) {
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
}
