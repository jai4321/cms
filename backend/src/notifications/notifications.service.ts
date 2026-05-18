import { Injectable, Inject } from '@nestjs/common';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { DRIZZLE } from '../db/drizzle.module';
import type { DrizzleClient } from '../db/drizzle.client';
import { notifications } from '../db/schema';
import type { PresenceStatus } from '../presence/presence.service';

export type NotificationType = 'mention' | 'thread_reply' | 'dm';

@Injectable()
export class NotificationsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleClient) {}

  async create(
    recipientId: string,
    type: NotificationType,
    payload: Record<string, unknown>,
  ) {
    const [notification] = await this.db
      .insert(notifications)
      .values({ recipientId, type, payload })
      .returning();
    return notification;
  }

  async list(userId: string, limit = 20, offset = 0) {
    return this.db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async markRead(userId: string, ids?: string[]) {
    if (ids && ids.length > 0) {
      await this.db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.recipientId, userId),
            inArray(notifications.id, ids),
          ),
        );
    } else {
      await this.db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.recipientId, userId));
    }
  }

  async unreadCount(userId: string): Promise<number> {
    const rows = await this.db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.recipientId, userId),
          eq(notifications.isRead, false),
        ),
      );
    return rows.length;
  }
}
