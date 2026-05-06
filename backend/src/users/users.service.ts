import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { DRIZZLE } from '../db/drizzle.module';
import type { DrizzleClient } from '../db/drizzle.client';
import { users } from '../db/schema';
import type { NewUser, User } from '../db/schema';
export type { User, NewUser };

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleClient) {}

  async findById(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return result[0];
  }

  async findByUsername(username: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return result[0];
  }

  async create(data: NewUser): Promise<User> {
    const result = await this.db.insert(users).values(data).returning();
    return result[0];
  }

  async update(id: string, data: Partial<NewUser>): Promise<User> {
    const result = await this.db
      .update(users)
      .set({ ...data, updatedAt: sql`now()` })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async findByEmailVerificationToken(token: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken, token));
    return result[0];
  }

  async findByPasswordResetToken(token: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, token));
    return result[0];
  }
}
