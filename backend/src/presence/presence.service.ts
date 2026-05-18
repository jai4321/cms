import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export type PresenceStatus = 'online' | 'away' | 'offline' | 'dnd';

const PRESENCE_TTL = 30; // seconds

@Injectable()
export class PresenceService implements OnModuleInit, OnModuleDestroy {
  private redis!: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.redis = new Redis(this.config.getOrThrow<string>('REDIS_URL'));
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  private key(userId: string) {
    return `presence:${userId}`;
  }

  async setStatus(userId: string, status: PresenceStatus): Promise<void> {
    await this.redis.setex(this.key(userId), PRESENCE_TTL, status);
  }

  async refreshTTL(userId: string): Promise<void> {
    await this.redis.expire(this.key(userId), PRESENCE_TTL);
  }

  async getStatus(userId: string): Promise<PresenceStatus> {
    const val = await this.redis.get(this.key(userId));
    return (val as PresenceStatus | null) ?? 'offline';
  }

  async getStatuses(userIds: string[]): Promise<Record<string, PresenceStatus>> {
    if (userIds.length === 0) return {};

    const keys = userIds.map((id) => this.key(id));
    const values = await this.redis.mget(...keys);

    const result: Record<string, PresenceStatus> = {};
    userIds.forEach((id, i) => {
      result[id] = (values[i] as PresenceStatus | null) ?? 'offline';
    });
    return result;
  }

  async clearStatus(userId: string): Promise<void> {
    await this.redis.del(this.key(userId));
  }
}
