import { Injectable, ConflictException } from '@nestjs/common';
import { Agent } from '../../../domain/ai-model/entities/agent.entity';
import { AgentName } from '../../../domain/ai-model/value-objects/agent-name.vo';
import { ModelName } from '../../../domain/ai-model/value-objects/model-name.vo';
import { SystemPrompt } from '../../../domain/ai-model/value-objects/system-prompt.vo';
import { IAgentRepository } from '../../../domain/ai-model/repositories/agent.repository.interface';
import { CreateAgentCommand } from '../../dto/create-agent.dto';
import { IOllamaService } from '../../ports/ollama-service.interface';
import { IEventBus } from '../../ports/event-bus.interface';
import { AgentCreatedEvent } from '../../../domain/ai-model/events/agent-created.event';

@Injectable()
export class CreateAgentUseCase {
  constructor(
    private readonly agentRepository: IAgentRepository,
    private readonly ollamaService: IOllamaService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: CreateAgentCommand, userId: string): Promise<any> {
    // 1. Check if agent name already exists
    const exists = await this.agentRepository.existsByName(command.name);
    if (exists) {
      throw new ConflictException(`Agent with name '${command.name}' already exists`);
    }

    // 2. Validate model exists in Ollama
    const modelExists = await this.ollamaService.modelExists(command.model);
    if (!modelExists) {
      throw new Error(`Model '${command.model}' not found in Ollama`);
    }

    // 3. Create domain entity with value objects
    const agent = Agent.create(
      AgentName.create(command.name),
      ModelName.create(command.model),
      SystemPrompt.create(command.systemPrompt),
      userId,
      command.capabilities || [],
      command.metadata
    );

    // 4. Persist
    await this.agentRepository.save(agent);

    // 5. Publish domain event
    await this.eventBus.publish(
      new AgentCreatedEvent(
        agent.id.value,
        agent.name.value,
        agent.model.value,
        userId
      )
    );

    // 6. Return DTO
    return agent.toJSON();
  }
}

