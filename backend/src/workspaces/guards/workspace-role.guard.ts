import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import type { WorkspaceRole } from '../../db/schema';

export const WORKSPACE_ROLE_KEY = 'workspaceRole';
export const RequireWorkspaceRole = (role: WorkspaceRole) =>
  SetMetadata(WORKSPACE_ROLE_KEY, role);

const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRole = this.reflector.getAllAndOverride<WorkspaceRole>(
      WORKSPACE_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No role requirement — pass through
    if (!requiredRole) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const member = (request as any).workspaceMember;

    if (!member) {
      throw new ForbiddenException('Workspace membership not resolved');
    }

    const userLevel = ROLE_HIERARCHY[member.role as WorkspaceRole] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;

    if (userLevel < requiredLevel) {
      throw new ForbiddenException(
        `Requires at least ${requiredRole} role in this workspace`,
      );
    }

    return true;
  }
}
