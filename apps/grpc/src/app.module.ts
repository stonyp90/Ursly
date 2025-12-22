import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { OllamaController } from './ollama/ollama.controller';
import { OllamaService } from './ollama/ollama.service';
import { HealthController } from './health/health.controller';
import { AuditService } from './audit/audit.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/agent-orchestrator'),
  ],
  controllers: [OllamaController, HealthController],
  providers: [OllamaService, AuditService],
})
export class AppModule {}

