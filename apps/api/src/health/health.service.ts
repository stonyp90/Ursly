import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class HealthService {
  constructor(@InjectConnection() private connection: Connection) {}

  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  async ready() {
    const dbState = this.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    return {
      status: dbState === 'connected' ? 'ready' : 'not ready',
      database: dbState,
      timestamp: new Date().toISOString(),
    };
  }
}

