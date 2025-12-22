export interface IEventBus {
  publish<T>(event: T): Promise<void>;
  publishAll<T>(events: T[]): Promise<void>;
}

