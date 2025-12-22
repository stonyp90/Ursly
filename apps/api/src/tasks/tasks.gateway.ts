import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TaskStreamEvent } from '@ursly/shared/types';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/tasks',
})
export class TasksGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('subscribeToTask')
  handleSubscribe(
    @MessageBody() data: { taskId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    client.join(`task:${data.taskId}`);
    console.log(`Client ${client.id} subscribed to task ${data.taskId}`);
  }

  @SubscribeMessage('unsubscribeFromTask')
  handleUnsubscribe(
    @MessageBody() data: { taskId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    client.leave(`task:${data.taskId}`);
    console.log(`Client ${client.id} unsubscribed from task ${data.taskId}`);
  }

  emitTaskUpdate(taskId: string, event: TaskStreamEvent): void {
    this.server.to(`task:${taskId}`).emit('taskUpdate', event);
  }

  emitTaskStream(taskId: string, chunk: string): void {
    this.server.to(`task:${taskId}`).emit('taskStream', {
      taskId,
      type: 'chunk',
      data: chunk,
      timestamp: new Date(),
    });
  }
}
