import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DirectMessagesService } from './direct-messages.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WorkspaceMemberGuard } from '../workspaces/guards/workspace-member.guard';
import { ParticipantGuard } from './guards/participant.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  CreateDmDto,
  AddParticipantDto,
  RenameGroupDto,
  SendMessageDto,
  GetMessagesDto,
} from './dto/direct-message.dto';
import type { User } from '../db/schema';

// ─── Workspace-scoped DM routes ───────────────────────────────────────────────

@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
@Controller('workspaces/:workspaceId/dm')
export class WorkspaceDmsController {
  constructor(private readonly directMessagesService: DirectMessagesService) {}

  // POST /workspaces/:workspaceId/dm
  @Post()
  @HttpCode(HttpStatus.OK)
  findOrCreate(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateDmDto,
  ) {
    return this.directMessagesService.findOrCreate(workspaceId, user.id, dto);
  }

  // GET /workspaces/:workspaceId/dm
  @Get()
  list(@Param('workspaceId') workspaceId: string, @CurrentUser() user: User) {
    return this.directMessagesService.listForUser(workspaceId, user.id);
  }
}

// ─── Conversation-scoped DM routes ───────────────────────────────────────────

@UseGuards(JwtAuthGuard, ParticipantGuard)
@Controller('dm/:conversationId')
export class DmsController {
  constructor(private readonly directMessagesService: DirectMessagesService) {}

  // GET /dm/:conversationId
  @Get()
  getConversation(@Param('conversationId') conversationId: string) {
    return this.directMessagesService.getConversation(conversationId);
  }

  // PATCH /dm/:conversationId/name
  @Patch('name')
  renameGroup(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: User,
    @Body() dto: RenameGroupDto,
  ) {
    return this.directMessagesService.renameGroup(conversationId, dto, user.id);
  }

  // DELETE /dm/:conversationId/leave
  @Delete('leave')
  @HttpCode(HttpStatus.OK)
  leaveGroup(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: User,
  ) {
    return this.directMessagesService.leaveGroup(conversationId, user.id);
  }

  // POST /dm/:conversationId/participants
  @Post('participants')
  addParticipant(
    @Param('conversationId') conversationId: string,
    @Body() dto: AddParticipantDto,
  ) {
    return this.directMessagesService.addParticipant(conversationId, dto);
  }

  // GET /dm/:conversationId/participants
  @Get('participants')
  listParticipants(@Param('conversationId') conversationId: string) {
    return this.directMessagesService.listParticipants(conversationId);
  }

  // POST /dm/:conversationId/messages
  @Post('messages')
  @HttpCode(HttpStatus.CREATED)
  sendMessage(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: User,
    @Body() dto: SendMessageDto,
  ) {
    return this.directMessagesService.sendMessage(conversationId, user.id, dto);
  }

  // GET /dm/:conversationId/messages?cursor=&limit=
  @Get('messages')
  getMessages(
    @Param('conversationId') conversationId: string,
    @Query() query: GetMessagesDto,
  ) {
    return this.directMessagesService.getMessages(conversationId, query);
  }
}
