export class AgentName {
  private constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Agent name cannot be empty');
    }
    if (value.length > 255) {
      throw new Error('Agent name cannot exceed 255 characters');
    }
  }

  static create(value: string): AgentName {
    return new AgentName(value.trim());
  }

  equals(other: AgentName): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

