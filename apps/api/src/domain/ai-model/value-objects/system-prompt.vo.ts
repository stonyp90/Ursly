export class SystemPrompt {
  private constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('System prompt cannot be empty');
    }
    if (value.length > 10000) {
      throw new Error('System prompt cannot exceed 10000 characters');
    }
  }

  static create(value: string): SystemPrompt {
    return new SystemPrompt(value.trim());
  }

  equals(other: SystemPrompt): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

