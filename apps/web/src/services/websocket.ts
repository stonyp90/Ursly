import { io, Socket } from 'socket.io-client';
import { env } from '../config';

export class WebSocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket) return;

    this.socket = io(`${env.ws.url}/tasks`, {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeToTask(taskId: string, callback: (event: any) => void) {
    if (!this.socket) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('subscribeToTask', { taskId });
    this.socket.on('taskUpdate', callback);
  }

  unsubscribeFromTask(taskId: string) {
    if (!this.socket) return;

    this.socket.emit('unsubscribeFromTask', { taskId });
    this.socket.off('taskUpdate');
  }
}

export const wsService = new WebSocketService();

