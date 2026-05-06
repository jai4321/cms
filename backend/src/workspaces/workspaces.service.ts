import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DRIZZLE } from '../db/drizzle.module';
import type { DrizzleClient } from '../db/drizzle.client';
import {
  workspaces,
  workspaceMembers,
  users,
} from '../db/schema';
import type { WorkspaceRole } from '../db/schema';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
} from './dto/workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleClient) {}

  // ─── Create ───────────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateWorkspaceDto) {
    const existing = await this.db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.slug, dto.slug))
      .limit(1);

    if (existing.length) {
      throw new ConflictException('A workspace with this slug already exists');
    }

    const [workspace] = await this.db
      .insert(workspaces)
      .values({
        name: dto.name,
        slug: dto.slug,
        iconUrl: dto.iconUrl,
        ownerId: userId,
      })
      .returning();

    // Creator becomes owner
    await this.db.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId,
      role: 'owner',
    });

    return workspace;
  }

  // ─── List (for current user) ──────────────────────────────────────────────────

  async listForUser(userId: string) {
    const rows = await this.db
      .select({
        workspace: workspaces,
        role: workspaceMembers.role,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, userId));

    return rows.map((r) => ({ ...r.workspace, role: r.role }));
  }

  // ─── Get one ──────────────────────────────────────────────────────────────────

  async findOne(workspaceId: string) {
    const [workspace] = await this.db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  // ─── Update ───────────────────────────────────────────────────────────────────

  async update(workspaceId: string, dto: UpdateWorkspaceDto) {
    const [updated] = await this.db
      .update(workspaces)
      .set({ ...dto, updatedAt: sql`now()` })
      .where(eq(workspaces.id, workspaceId))
      .returning();

    if (!updated) throw new NotFoundException('Workspace not found');
    return updated;
  }

  // ─── Delete ───────────────────────────────────────────────────────────────────

  async remove(workspaceId: string) {
    await this.db
      .delete(workspaces)
      .where(eq(workspaces.id, workspaceId));
  }

  // ─── Invite ───────────────────────────────────────────────────────────────────

  async invite(workspaceId: string, dto: InviteMemberDto) {
    const [user] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (!user) {
      throw new NotFoundException('No user found with that email address');
    }

    const existing = await this.db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, user.id),
        ),
      )
      .limit(1);

    if (existing.length) {
      throw new ConflictException('User is already a member of this workspace');
    }

    const [member] = await this.db
      .insert(workspaceMembers)
      .values({
        workspaceId,
        userId: user.id,
        role: dto.role ?? 'member',
      })
      .returning();

    return member;
  }

  // ─── List members ─────────────────────────────────────────────────────────────

  async listMembers(workspaceId: string) {
    return this.db
      .select({
        id: workspaceMembers.id,
        role: workspaceMembers.role,
        joinedAt: workspaceMembers.joinedAt,
        user: {
          id: users.id,
          email: users.email,
          username: users.username,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.workspaceId, workspaceId));
  }

  // ─── Change role ──────────────────────────────────────────────────────────────

  async updateMemberRole(
    workspaceId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const [membership] = await this.db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, targetUserId),
        ),
      )
      .limit(1);

    if (!membership) throw new NotFoundException('Member not found');

    if (membership.role === 'owner') {
      throw new ForbiddenException('Cannot change the role of the workspace owner');
    }

    const [updated] = await this.db
      .update(workspaceMembers)
      .set({ role: dto.role as WorkspaceRole })
      .where(eq(workspaceMembers.id, membership.id))
      .returning();

    return updated;
  }

  // ─── Remove member ────────────────────────────────────────────────────────────

  async removeMember(workspaceId: string, targetUserId: string) {
    const [membership] = await this.db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, targetUserId),
        ),
      )
      .limit(1);

    if (!membership) throw new NotFoundException('Member not found');

    if (membership.role === 'owner') {
      throw new ForbiddenException('The workspace owner cannot be removed');
    }

    await this.db
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.id, membership.id));
  }
}
