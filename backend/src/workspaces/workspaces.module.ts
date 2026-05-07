import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { WorkspaceMemberGuard } from './guards/workspace-member.guard';
import { WorkspaceRoleGuard } from './guards/workspace-role.guard';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspaceMemberGuard, WorkspaceRoleGuard],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
