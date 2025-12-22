import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { patchNestJsSwagger } from 'nestjs-zod';
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';
import {
  AgentSchema,
  CreateAgentDtoSchema,
  UpdateAgentDtoSchema,
  QueryAgentDtoSchema,
  AgentListResponseSchema,
  TaskSchema,
  CreateTaskDtoSchema,
  QueryTaskDtoSchema,
  TaskListResponseSchema,
  AuditLogSchema,
  CreateAuditLogDtoSchema,
  QueryAuditLogDtoSchema,
  AuditLogListResponseSchema,
} from '@ursly/shared/types';

/**
 * Register all Zod schemas with OpenAPI registry
 */
export function createOpenApiRegistry(): OpenAPIRegistry {
  const registry = new OpenAPIRegistry();

  // Agent schemas
  registry.register('Agent', AgentSchema);
  registry.register('CreateAgentDto', CreateAgentDtoSchema);
  registry.register('UpdateAgentDto', UpdateAgentDtoSchema);
  registry.register('QueryAgentDto', QueryAgentDtoSchema);
  registry.register('AgentListResponse', AgentListResponseSchema);

  // Task schemas
  registry.register('Task', TaskSchema);
  registry.register('CreateTaskDto', CreateTaskDtoSchema);
  registry.register('QueryTaskDto', QueryTaskDtoSchema);
  registry.register('TaskListResponse', TaskListResponseSchema);

  // Audit Log schemas
  registry.register('AuditLog', AuditLogSchema);
  registry.register('CreateAuditLogDto', CreateAuditLogDtoSchema);
  registry.register('QueryAuditLogDto', QueryAuditLogDtoSchema);
  registry.register('AuditLogListResponse', AuditLogListResponseSchema);

  return registry;
}

/**
 * Generate OpenAPI definitions from Zod schemas
 */
export function generateOpenApiDefinitions(registry: OpenAPIRegistry) {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateComponents();
}

/**
 * Setup Swagger/OpenAPI documentation
 */
export function setupOpenApi(app: INestApplication): void {
  // Patch NestJS Swagger to work with nestjs-zod
  patchNestJsSwagger();

  const config = new DocumentBuilder()
    .setTitle('Ursly.io Agent Orchestrator API')
    .setDescription(
      `
## Overview

The Ursly.io Agent Orchestrator API provides endpoints for managing AI agents, tasks, and audit logs.

### Architecture

This API follows **Clean Architecture** principles:
- **Domain Layer**: Core business entities and rules
- **Application Layer**: Use cases and business logic
- **Infrastructure Layer**: Adapters for external services (MongoDB, Ollama)
- **Presentation Layer**: REST API controllers

### Authentication

All endpoints require a valid JWT token from Keycloak.

### Schemas

All request/response schemas are defined using **Zod** and automatically validated.
    `,
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('agents', 'Agent management endpoints')
    .addTag('tasks', 'Task execution endpoints')
    .addTag('audit', 'Audit log endpoints')
    .addTag('models', 'AI model management endpoints')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Merge Zod-generated schemas
  const registry = createOpenApiRegistry();
  const zodSchemas = generateOpenApiDefinitions(registry);

  if (zodSchemas.components?.schemas) {
    document.components = document.components || {};
    document.components.schemas = {
      ...document.components.schemas,
      ...(zodSchemas.components.schemas as any),
    };
  }

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Ursly.io Agent Orchestrator API',
  });
}
