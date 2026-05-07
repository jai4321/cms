import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE } from '../../db/drizzle.module';
import type { DrizzleClient } from '../../db/drizzle.client';
import { dmParticipants } from '../../db/schema';

@Injectable()
export class ParticipantGuard implements CanActivate {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;
    const rawId =
      request.params['conversationId'] || request.params['id'];
    const conversationId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!conversationId) {
      throw new NotFoundException('Conversation not found');
    }

    const participant = await this.db
      .select()
      .from(dmParticipants)
      .where(
        and(
          eq(dmParticipants.conversationId, conversationId),
          eq(dmParticipants.userId, user.id),
        ),
      )
      .limit(1);

    if (!participant.length) {
      throw new ForbiddenException(
        'You are not a participant of this conversation',
      );
    }

    return true;
  }
}
