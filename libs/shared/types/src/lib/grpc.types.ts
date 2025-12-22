// gRPC generated types will be imported here
// These types are auto-generated from proto files
export * from './grpc-generated';

// Additional gRPC helper types
export interface GrpcClientConfig {
  url: string;
  credentials?: any;
  options?: Record<string, any>;
}

export interface StreamOptions {
  metadata?: Record<string, string>;
  deadline?: Date;
}

