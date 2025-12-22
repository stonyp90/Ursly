import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { existsSync } from 'fs';
import { AppModule } from './app.module';

function getProtoPath(filename: string): string {
  // Check various possible locations
  const paths = [
    join(__dirname, `../proto/${filename}`),        // Production (docker)
    join(__dirname, `../src/proto/${filename}`),    // Development
    join(process.cwd(), `proto/${filename}`),       // Docker workdir
    join(process.cwd(), `apps/grpc/src/proto/${filename}`), // Local dev
  ];

  for (const p of paths) {
    if (existsSync(p)) {
      return p;
    }
  }

  // Default to production path
  return paths[0];
}

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: ['ollama', 'grpc.health.v1'],
      protoPath: [
        getProtoPath('ollama.proto'),
        getProtoPath('health.proto'),
      ],
      url: `0.0.0.0:${process.env.GRPC_PORT || 50051}`,
      maxReceiveMessageLength: 1024 * 1024 * 100, // 100MB
      maxSendMessageLength: 1024 * 1024 * 100, // 100MB
    },
  });

  await app.listen();
  console.log(`gRPC Ollama Service listening on port ${process.env.GRPC_PORT || 50051}`);
}

bootstrap();

