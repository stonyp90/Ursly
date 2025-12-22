export enum AgentStatusValue {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  STOPPED = 'stopped',
}

export class AgentStatus {
  private constructor(public readonly value: AgentStatusValue) {}

  static active(): AgentStatus {
    return new AgentStatus(AgentStatusValue.ACTIVE);
  }

  static suspended(): AgentStatus {
    return new AgentStatus(AgentStatusValue.SUSPENDED);
  }

  static stopped(): AgentStatus {
    return new AgentStatus(AgentStatusValue.STOPPED);
  }

  static from(value: string): AgentStatus {
    const statusValue = Object.values(AgentStatusValue).find(v => v === value);
    if (!statusValue) {
      throw new Error(`Invalid agent status: ${value}`);
    }
    return new AgentStatus(statusValue);
  }

  isActive(): boolean {
    return this.value === AgentStatusValue.ACTIVE;
  }

  isSuspended(): boolean {
    return this.value === AgentStatusValue.SUSPENDED;
  }

  isStopped(): boolean {
    return this.value === AgentStatusValue.STOPPED;
  }

  equals(other: AgentStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

