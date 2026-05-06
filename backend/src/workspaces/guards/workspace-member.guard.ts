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
import { workspaceMembers } from '../../db/schema';

@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;
    const rawId = request.params['id'] || request.params['workspaceId'];
    const workspaceId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!workspaceId) {
      throw new NotFoundException('Workspace not found');
    }

    const membership = await this.db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, user.id),
        ),
      )
      .limit(1);

    if (!membership.length) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // Attach membership to request for downstream use
    (request as any).workspaceMember = membership[0];
    return true;
  }
}
