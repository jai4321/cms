import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PostReplyDto, AddReactionDto, GetRepliesDto } from './dto/messages.dto';
import { ChatGateway } from '../chat/chat.gateway';
import type { User } from '../db/schema';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly chatGateway: ChatGateway,
  ) {}

  // ─── Thread Replies ───────────────────────────────────────────────────────────

  // POST /messages/:id/replies
  @Post(':id/replies')
  @HttpCode(HttpStatus.CREATED)
  async postReply(
    @Param('id') messageId: string,
    @CurrentUser() user: User,
    @Body() dto: PostReplyDto,
  ) {
    const message = await this.messagesService.verifyAccess(messageId, user.id);
    const reply = await this.messagesService.postReply(messageId, user.id, dto);

    // Broadcast reply to the conversation room
    this.chatGateway.server
      .to(`dm:${message.conversationId}`)
      .emit('thread:reply', { parentMessageId: messageId, reply });

    // Parse and save mentions in the reply
    const mentionedIds = await this.messagesService.parseMentions(dto.content);
    // Note: mentions in thread replies use a different message reference
    // We emit socket notifications for mentions directly
    for (const uid of mentionedIds) {
      this.chatGateway.server
        .to(`user:${uid}`)
        .emit('mention:notify', {
          messageId: reply.id,
          parentMessageId: messageId,
          conversationId: message.conversationId,
          mentionedBy: { id: user.id, username: user.username },
          content: dto.content,
        });
    }

    return reply;
  }

  // GET /messages/:id/replies
  @Get(':id/replies')
  async getReplies(
    @Param('id') messageId: string,
    @CurrentUser() user: User,
    @Query() query: GetRepliesDto,
  ) {
    await this.messagesService.verifyAccess(messageId, user.id);
    return this.messagesService.getReplies(messageId, query);
  }

  // ─── Reactions ────────────────────────────────────────────────────────────────

  // POST /messages/:id/reactions
  @Post(':id/reactions')
  @HttpCode(HttpStatus.CREATED)
  async addReaction(
    @Param('id') messageId: string,
    @CurrentUser() user: User,
    @Body() dto: AddReactionDto,
  ) {
    const message = await this.messagesService.verifyAccess(messageId, user.id);
    const reaction = await this.messagesService.addReaction(messageId, user.id, dto);

    // Broadcast reaction update to the conversation room
    this.chatGateway.server
      .to(`dm:${message.conversationId}`)
      .emit('reaction:update', {
        messageId,
        reaction: { ...reaction, userId: user.id },
        action: 'add',
      });

    return reaction;
  }

  // DELETE /messages/:id/reactions/:emoji
  @Delete(':id/reactions/:emoji')
  @HttpCode(HttpStatus.OK)
  async removeReaction(
    @Param('id') messageId: string,
    @Param('emoji') emoji: string,
    @CurrentUser() user: User,
  ) {
    const message = await this.messagesService.verifyAccess(messageId, user.id);
    const result = await this.messagesService.removeReaction(messageId, user.id, emoji);

    // Broadcast reaction removal
    this.chatGateway.server
      .to(`dm:${message.conversationId}`)
      .emit('reaction:update', {
        messageId,
        emoji,
        userId: user.id,
        action: 'remove',
      });

    return result;
  }

  // GET /messages/:id/reactions
  @Get(':id/reactions')
  async getReactions(
    @Param('id') messageId: string,
    @CurrentUser() user: User,
  ) {
    await this.messagesService.verifyAccess(messageId, user.id);
    return this.messagesService.getReactions(messageId);
  }

  // GET /messages/:id
  @Get(':id')
  async getMessageById(
    @Param('id') messageId: string,
    @CurrentUser() user: User,
  ) {
    await this.messagesService.verifyAccess(messageId, user.id);
    return this.messagesService.getMessageById(messageId);
  }
}
