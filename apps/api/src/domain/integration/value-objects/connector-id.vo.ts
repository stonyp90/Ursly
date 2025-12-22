import { randomUUID } from 'crypto';

export class ConnectorId {
  private constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Connector ID cannot be empty');
    }
  }

  static create(value: string): ConnectorId {
    return new ConnectorId(value);
  }

  static generate(): ConnectorId {
    return new ConnectorId(randomUUID());
  }

  equals(other: ConnectorId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

