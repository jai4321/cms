import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WorkspaceMemberGuard } from './guards/workspace-member.guard';
import { WorkspaceRoleGuard, RequireWorkspaceRole } from './guards/workspace-role.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
} from './dto/workspace.dto';
import type { User } from '../db/schema';

@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  // POST /workspaces
  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateWorkspaceDto) {
    return this.workspacesService.create(user.id, dto);
  }

  // GET /workspaces
  @Get()
  list(@CurrentUser() user: User) {
    return this.workspacesService.listForUser(user.id);
  }

  // GET /workspaces/:id
  @Get(':id')
  @UseGuards(WorkspaceMemberGuard, WorkspaceRoleGuard)
  findOne(@Param('id') id: string) {
    return this.workspacesService.findOne(id);
  }

  // PATCH /workspaces/:id
  @Patch(':id')
  @UseGuards(WorkspaceMemberGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole('admin')
  update(@Param('id') id: string, @Body() dto: UpdateWorkspaceDto) {
    return this.workspacesService.update(id, dto);
  }

  // DELETE /workspaces/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(WorkspaceMemberGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole('owner')
  remove(@Param('id') id: string) {
    return this.workspacesService.remove(id);
  }

  // POST /workspaces/:id/invite
  @Post(':id/invite')
  @UseGuards(WorkspaceMemberGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole('admin')
  invite(@Param('id') id: string, @Body() dto: InviteMemberDto) {
    return this.workspacesService.invite(id, dto);
  }

  // GET /workspaces/:id/members
  @Get(':id/members')
  @UseGuards(WorkspaceMemberGuard, WorkspaceRoleGuard)
  listMembers(@Param('id') id: string) {
    return this.workspacesService.listMembers(id);
  }

  // PATCH /workspaces/:id/members/:userId
  @Patch(':id/members/:userId')
  @UseGuards(WorkspaceMemberGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole('owner')
  updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.workspacesService.updateMemberRole(id, userId, dto);
  }

  // DELETE /workspaces/:id/members/:userId
  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(WorkspaceMemberGuard, WorkspaceRoleGuard)
  @RequireWorkspaceRole('admin')
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.workspacesService.removeMember(id, userId);
  }
}
