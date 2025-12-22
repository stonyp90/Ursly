import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  RealtimeEvent,
  RealtimeEntityType,
  SubscriptionRequest,
  SubscriptionResponse,
  WS_ROOMS,
} from '@ursly/shared/types';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private connectedClients: Map<
    string,
    { userId?: string; organizationId?: string }
  > = new Map();

  afterInit() {
    this.logger.log('Realtime WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, {});

    // Send connection confirmation
    client.emit('connected', {
      clientId: client.id,
      timestamp: new Date(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  /**
   * Authenticate client with user/org context
   */
  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @MessageBody() data: { userId: string; organizationId: string },
    @ConnectedSocket() client: Socket,
  ): { success: boolean } {
    this.connectedClients.set(client.id, {
      userId: data.userId,
      organizationId: data.organizationId,
    });

    // Join organization room
    const orgRoom = WS_ROOMS.organization(data.organizationId);
    client.join(orgRoom);
    this.logger.log(
      `Client ${client.id} authenticated for org ${data.organizationId}`,
    );

    // Join user-specific room
    const userRoom = WS_ROOMS.user(data.userId);
    client.join(userRoom);

    return { success: true };
  }

  /**
   * Subscribe to entity updates
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() request: SubscriptionRequest,
    @ConnectedSocket() client: Socket,
  ): SubscriptionResponse {
    const room = request.entityId
      ? WS_ROOMS.entity(request.entityType, request.entityId)
      : WS_ROOMS.all(request.entityType);

    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);

    return {
      success: true,
      subscription: request,
      room,
    };
  }

  /**
   * Unsubscribe from entity updates
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() request: SubscriptionRequest,
    @ConnectedSocket() client: Socket,
  ): { success: boolean } {
    const room = request.entityId
      ? WS_ROOMS.entity(request.entityType, request.entityId)
      : WS_ROOMS.all(request.entityType);

    client.leave(room);
    this.logger.log(`Client ${client.id} unsubscribed from ${room}`);

    return { success: true };
  }

  /**
   * Emit event to specific entity room
   */
  emitToEntity<T>(
    entityType: RealtimeEntityType,
    entityId: string,
    event: RealtimeEvent<T>,
  ): void {
    const room = WS_ROOMS.entity(entityType, entityId);
    this.server.to(room).emit('entityUpdate', event);

    // Also emit to "all" room for this entity type
    const allRoom = WS_ROOMS.all(entityType);
    this.server.to(allRoom).emit('entityUpdate', event);
  }

  /**
   * Emit event to organization room
   */
  emitToOrganization<T>(organizationId: string, event: RealtimeEvent<T>): void {
    const room = WS_ROOMS.organization(organizationId);
    this.server.to(room).emit('entityUpdate', event);
  }

  /**
   * Emit event to specific user
   */
  emitToUser<T>(userId: string, event: RealtimeEvent<T>): void {
    const room = WS_ROOMS.user(userId);
    this.server.to(room).emit('notification', event);
  }

  /**
   * Broadcast to all connected clients (use sparingly)
   */
  broadcast<T>(event: RealtimeEvent<T>): void {
    this.server.emit('broadcast', event);
  }

  /**
   * Get connected client count
   */
  getConnectedClientCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get clients in a specific room
   */
  async getClientsInRoom(room: string): Promise<string[]> {
    const sockets = await this.server.in(room).fetchSockets();
    return sockets.map((s) => s.id);
  }
}
