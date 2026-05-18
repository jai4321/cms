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
import { dmParticipants, workspaceMembers } from '../db/schema';
import { DirectMessagesService } from '../direct-messages/direct-messages.service';
import { SendMessageDto } from '../direct-messages/dto/direct-message.dto';
import { PresenceService, PresenceStatus } from '../presence/presence.service';
import { NotificationsService } from '../notifications/notifications.service';

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
    private readonly presenceService: PresenceService,
    private readonly notificationsService: NotificationsService,
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

      // Join personal room for direct notifications
      await client.join(`user:${payload.sub}`);

      // Join all DM rooms for this user
      await this.joinUserRooms(client as AuthenticatedSocket);

      // Join all workspace rooms for presence broadcasting
      await this.joinWorkspaceRooms(client as AuthenticatedSocket);

      // Set presence online and broadcast
      await this.presenceService.setStatus(payload.sub, 'online');
      await this.broadcastPresence(payload.sub, 'online');

      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      this.logger.warn(`Unauthorized connection attempt: ${client.id}`);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = (client as AuthenticatedSocket).userId;
    if (userId) {
      await this.presenceService.clearStatus(userId);
      await this.broadcastPresence(userId, 'offline');
      this.logger.log(`Client disconnected: ${client.id} (user: ${userId})`);
    } else {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
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

  // ─── Join all workspace rooms for this user ───────────────────────────────────

  private async joinWorkspaceRooms(client: AuthenticatedSocket) {
    const rows = await this.db
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, client.userId));

    for (const row of rows) {
      await client.join(`workspace:${row.workspaceId}`);
    }
  }

  // ─── Broadcast presence update to all workspaces of a user ───────────────────

  private async broadcastPresence(userId: string, status: PresenceStatus) {
    const rows = await this.db
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId));

    for (const row of rows) {
      this.server
        .to(`workspace:${row.workspaceId}`)
        .emit('presence:update', { userId, status });
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

  // ─── Join a specific workspace room ──────────────────────────────────────────

  @SubscribeMessage('workspace:join')
  async handleJoinWorkspace(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { workspaceId: string },
  ) {
    const [member] = await this.db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, data.workspaceId),
          eq(workspaceMembers.userId, client.userId),
        ),
      )
      .limit(1);

    if (!member) throw new WsException('Not a workspace member');

    await client.join(`workspace:${data.workspaceId}`);
    return { joined: true };
  }

  // ─── Send message via socket ──────────────────────────────────────────────────

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: { conversationId: string; content: string; attachmentIds?: string[] },
  ) {
    if (!data.conversationId || !data.content?.trim()) {
      throw new WsException('Invalid payload');
    }

    // Verify participant + collect all participants for DM notification
    const participants = await this.db
      .select()
      .from(dmParticipants)
      .where(eq(dmParticipants.conversationId, data.conversationId));

    const isMember = participants.some((p) => p.userId === client.userId);
    if (!isMember) throw new WsException('Not a participant');

    const dto: SendMessageDto = {
      content: data.content.trim(),
      attachmentIds: data.attachmentIds,
    };
    const result = await this.dmService.sendMessage(
      data.conversationId,
      client.userId,
      dto,
    );

    // Broadcast to all room members (including sender)
    this.server.to(`dm:${data.conversationId}`).emit('message:new', result);

    // Persist + emit DM notification to other participants
    for (const p of participants) {
      if (p.userId === client.userId) continue;
      const dmNotification = await this.notificationsService.create(
        p.userId,
        'dm',
        {
          messageId: result.id,
          conversationId: data.conversationId,
          senderId: client.userId,
          preview: result.content.slice(0, 100),
        },
      );
      this.server
        .to(`user:${p.userId}`)
        .emit('notification:new', dmNotification);
    }

    // Persist + emit mention notifications to mentioned users
    for (const uid of result.mentionedUserIds) {
      const mentionNotification = await this.notificationsService.create(
        uid,
        'mention',
        {
          messageId: result.id,
          conversationId: data.conversationId,
          mentionedBy: client.userId,
          preview: result.content.slice(0, 100),
        },
      );
      this.server
        .to(`user:${uid}`)
        .emit('notification:new', mentionNotification);
      // Also emit legacy mention:notify for existing listeners
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

  // ─── Presence: manual status update ──────────────────────────────────────────

  @SubscribeMessage('presence:update')
  async handlePresenceUpdate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { status: PresenceStatus },
  ) {
    const allowed: PresenceStatus[] = ['online', 'away', 'offline', 'dnd'];
    if (!allowed.includes(data.status)) {
      throw new WsException('Invalid status');
    }

    await this.presenceService.setStatus(client.userId, data.status);
    await this.broadcastPresence(client.userId, data.status);

    return { status: data.status };
  }

  // ─── Presence: heartbeat to keep TTL alive ───────────────────────────────────

  @SubscribeMessage('presence:heartbeat')
  async handleHeartbeat(@ConnectedSocket() client: AuthenticatedSocket) {
    await this.presenceService.refreshTTL(client.userId);
    return { ok: true };
  }

  // ─── Presence: bulk fetch status for a list of userIds ───────────────────────

  @SubscribeMessage('presence:get')
  async handlePresenceGet(
    @ConnectedSocket() _client: AuthenticatedSocket,
    @MessageBody() data: { userIds: string[] },
  ) {
    if (!Array.isArray(data.userIds)) throw new WsException('Invalid payload');
    const statuses = await this.presenceService.getStatuses(data.userIds);
    return statuses;
  }
}
