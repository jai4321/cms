import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DRIZZLE } from '../db/drizzle.module';
import type { DrizzleClient } from '../db/drizzle.client';
import { eq, and } from 'drizzle-orm';
import { dmParticipants } from '../db/schema';
import { DirectMessagesService } from '../direct-messages/direct-messages.service';
import { SendMessageDto } from '../direct-messages/dto/direct-message.dto';

interface AuthenticatedSocket extends Socket {
  userId: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly dmService: DirectMessagesService,
    @Inject(DRIZZLE) private readonly db: DrizzleClient,
  ) {}

  // ─── Connection / Auth ────────────────────────────────────────────────────────

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth as Record<string, string>).token ??
        (client.handshake.headers.authorization ?? '').replace('Bearer ', '');

      if (!token) throw new Error('No token');

      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });

      (client as AuthenticatedSocket).userId = payload.sub;

      // Join personal room for direct notifications (mentions, etc.)
      await client.join(`user:${payload.sub}`);

      // Join all DM rooms for this user
      await this.joinUserRooms(client as AuthenticatedSocket);

      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      this.logger.warn(`Unauthorized connection attempt: ${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ─── Join all DM conversation rooms for user ──────────────────────────────────

  private async joinUserRooms(client: AuthenticatedSocket) {
    const rows = await this.db
      .select({ conversationId: dmParticipants.conversationId })
      .from(dmParticipants)
      .where(eq(dmParticipants.userId, client.userId));

    for (const row of rows) {
      await client.join(`dm:${row.conversationId}`);
    }
  }

  // ─── Join a specific DM room (called after creating a new DM) ────────────────

  @SubscribeMessage('dm:join')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const [participant] = await this.db
      .select()
      .from(dmParticipants)
      .where(
        and(
          eq(dmParticipants.conversationId, data.conversationId),
          eq(dmParticipants.userId, client.userId),
        ),
      )
      .limit(1);

    if (!participant) throw new WsException('Not a participant');

    await client.join(`dm:${data.conversationId}`);
    return { joined: true };
  }

  // ─── Send message via socket ──────────────────────────────────────────────────

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    if (!data.conversationId || !data.content?.trim()) {
      throw new WsException('Invalid payload');
    }

    // Verify participant
    const [participant] = await this.db
      .select()
      .from(dmParticipants)
      .where(
        and(
          eq(dmParticipants.conversationId, data.conversationId),
          eq(dmParticipants.userId, client.userId),
        ),
      )
      .limit(1);

    if (!participant) throw new WsException('Not a participant');

    const dto: SendMessageDto = { content: data.content.trim() };
    const result = await this.dmService.sendMessage(
      data.conversationId,
      client.userId,
      dto,
    );

    // Broadcast to all room members (including sender)
    this.server.to(`dm:${data.conversationId}`).emit('message:new', result);

    // Emit mention notifications to mentioned users
    for (const uid of result.mentionedUserIds) {
      this.server.to(`user:${uid}`).emit('mention:notify', {
        messageId: result.id,
        conversationId: data.conversationId,
        mentionedBy: { id: client.userId },
        content: result.content,
      });
    }

    return result;
  }

  // ─── Typing indicator (ephemeral, no DB write) ────────────────────────────────

  @SubscribeMessage('message:typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    if (!data.conversationId) throw new WsException('Invalid payload');

    // Broadcast to others in the room (not sender)
    client.to(`dm:${data.conversationId}`).emit('message:typing', {
      conversationId: data.conversationId,
      userId: client.userId,
      isTyping: data.isTyping ?? true,
    });
  }
}
