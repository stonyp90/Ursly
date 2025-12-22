import { AgentId } from '../value-objects/agent-id.vo';
import { AgentName } from '../value-objects/agent-name.vo';
import { ModelName } from '../value-objects/model-name.vo';
import { SystemPrompt } from '../value-objects/system-prompt.vo';
import { AgentStatus } from '../value-objects/agent-status.vo';

export interface AgentProps {
  id: AgentId;
  name: AgentName;
  model: ModelName;
  systemPrompt: SystemPrompt;
  status: AgentStatus;
  capabilities: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export class Agent {
  private constructor(private props: AgentProps) {}

  static create(
    name: AgentName,
    model: ModelName,
    systemPrompt: SystemPrompt,
    createdBy: string,
    capabilities: string[] = [],
    metadata?: Record<string, any>
  ): Agent {
    return new Agent({
      id: AgentId.generate(),
      name,
      model,
      systemPrompt,
      status: AgentStatus.active(),
      capabilities,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata,
    });
  }

  static reconstitute(props: AgentProps): Agent {
    return new Agent(props);
  }

  // Getters
  get id(): AgentId {
    return this.props.id;
  }

  get name(): AgentName {
    return this.props.name;
  }

  get model(): ModelName {
    return this.props.model;
  }

  get systemPrompt(): SystemPrompt {
    return this.props.systemPrompt;
  }

  get status(): AgentStatus {
    return this.props.status;
  }

  get capabilities(): string[] {
    return [...this.props.capabilities];
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get metadata(): Record<string, any> | undefined {
    return this.props.metadata ? { ...this.props.metadata } : undefined;
  }

  // Business Methods
  updateName(name: AgentName): void {
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  updateModel(model: ModelName): void {
    this.props.model = model;
    this.props.updatedAt = new Date();
  }

  updateSystemPrompt(prompt: SystemPrompt): void {
    this.props.systemPrompt = prompt;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    if (!this.props.status.isActive()) {
      this.props.status = AgentStatus.active();
      this.props.updatedAt = new Date();
    }
  }

  suspend(): void {
    if (this.props.status.isActive()) {
      this.props.status = AgentStatus.suspended();
      this.props.updatedAt = new Date();
    }
  }

  stop(): void {
    this.props.status = AgentStatus.stopped();
    this.props.updatedAt = new Date();
  }

  canExecuteTask(): boolean {
    return this.props.status.isActive();
  }

  toJSON(): any {
    return {
      id: this.props.id.value,
      name: this.props.name.value,
      model: this.props.model.value,
      systemPrompt: this.props.systemPrompt.value,
      status: this.props.status.value,
      capabilities: this.capabilities,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata,
    };
  }
}

