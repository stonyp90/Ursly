import { ConnectorId } from '../value-objects/connector-id.vo';
import { ConnectorType } from '../value-objects/connector-type.vo';
import { ConnectorStatus } from '../value-objects/connector-status.vo';

export interface ConnectorProps {
  id: ConnectorId;
  type: ConnectorType;
  name: string;
  status: ConnectorStatus;
  config: ConnectorConfig;
  position: Position;
  connections: Connection[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectorConfig {
  authType: 'oauth2' | 'api-key' | 'none';
  credentials?: Record<string, string>;
  settings: Record<string, any>;
}

export interface Position {
  x: number;
  y: number;
}

export interface Connection {
  sourceId: string;
  targetId: string;
  sourcePort: string;
  targetPort: string;
}

export class Connector {
  private constructor(private props: ConnectorProps) {}

  static create(
    type: ConnectorType,
    name: string,
    config: ConnectorConfig,
    position: Position,
    createdBy: string
  ): Connector {
    return new Connector({
      id: ConnectorId.generate(),
      type,
      name,
      status: ConnectorStatus.disconnected(),
      config,
      position,
      connections: [],
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: ConnectorProps): Connector {
    return new Connector(props);
  }

  // Getters
  get id(): ConnectorId {
    return this.props.id;
  }

  get type(): ConnectorType {
    return this.props.type;
  }

  get name(): string {
    return this.props.name;
  }

  get status(): ConnectorStatus {
    return this.props.status;
  }

  get position(): Position {
    return { ...this.props.position };
  }

  get connections(): Connection[] {
    return [...this.props.connections];
  }

  // Business Methods
  connect(): void {
    this.props.status = ConnectorStatus.connected();
    this.props.updatedAt = new Date();
  }

  disconnect(): void {
    this.props.status = ConnectorStatus.disconnected();
    this.props.updatedAt = new Date();
  }

  updatePosition(x: number, y: number): void {
    this.props.position = { x, y };
    this.props.updatedAt = new Date();
  }

  addConnection(connection: Connection): void {
    this.props.connections.push(connection);
    this.props.updatedAt = new Date();
  }

  removeConnection(sourceId: string, targetId: string): void {
    this.props.connections = this.props.connections.filter(
      c => !(c.sourceId === sourceId && c.targetId === targetId)
    );
    this.props.updatedAt = new Date();
  }

  canConnect(): boolean {
    return this.props.status.isDisconnected() || this.props.status.isConnected();
  }

  toJSON(): any {
    return {
      id: this.props.id.value,
      type: this.props.type.value,
      name: this.props.name,
      status: this.props.status.value,
      config: this.props.config,
      position: this.props.position,
      connections: this.props.connections,
      createdBy: this.props.createdBy,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}

