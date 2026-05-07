import { Module } from '@nestjs/common';
import {
  WorkspaceDmsController,
  DmsController,
} from './direct-messages.controller';
import { DirectMessagesService } from './direct-messages.service';
import { WorkspaceMemberGuard } from '../workspaces/guards/workspace-member.guard';
import { ParticipantGuard } from './guards/participant.guard';

@Module({
  controllers: [WorkspaceDmsController, DmsController],
  providers: [DirectMessagesService, WorkspaceMemberGuard, ParticipantGuard],
})
export class DirectMessagesModule {}
