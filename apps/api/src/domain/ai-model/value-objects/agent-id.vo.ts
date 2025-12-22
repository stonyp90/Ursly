import { randomUUID } from 'crypto';

export class AgentId {
  private constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Agent ID cannot be empty');
    }
  }

  static create(value: string): AgentId {
    return new AgentId(value);
  }

  static generate(): AgentId {
    return new AgentId(randomUUID());
  }

  equals(other: AgentId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

