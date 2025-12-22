export class AgentCreatedEvent {
  constructor(
    public readonly agentId: string,
    public readonly name: string,
    public readonly model: string,
    public readonly createdBy: string,
    public readonly timestamp: Date = new Date()
  ) {}

  toJSON() {
    return {
      eventType: 'AgentCreated',
      agentId: this.agentId,
      name: this.name,
      model: this.model,
      createdBy: this.createdBy,
      timestamp: this.timestamp,
    };
  }
}

