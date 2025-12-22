export enum ConnectorStatusValue {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  ERROR = 'error',
}

export class ConnectorStatus {
  private constructor(public readonly value: ConnectorStatusValue) {}

  static connected(): ConnectorStatus {
    return new ConnectorStatus(ConnectorStatusValue.CONNECTED);
  }

  static disconnected(): ConnectorStatus {
    return new ConnectorStatus(ConnectorStatusValue.DISCONNECTED);
  }

  static connecting(): ConnectorStatus {
    return new ConnectorStatus(ConnectorStatusValue.CONNECTING);
  }

  static error(): ConnectorStatus {
    return new ConnectorStatus(ConnectorStatusValue.ERROR);
  }

  static from(value: string): ConnectorStatus {
    const statusValue = Object.values(ConnectorStatusValue).find(v => v === value);
    if (!statusValue) {
      throw new Error(`Invalid connector status: ${value}`);
    }
    return new ConnectorStatus(statusValue);
  }

  isConnected(): boolean {
    return this.value === ConnectorStatusValue.CONNECTED;
  }

  isDisconnected(): boolean {
    return this.value === ConnectorStatusValue.DISCONNECTED;
  }

  isConnecting(): boolean {
    return this.value === ConnectorStatusValue.CONNECTING;
  }

  isError(): boolean {
    return this.value === ConnectorStatusValue.ERROR;
  }

  equals(other: ConnectorStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

