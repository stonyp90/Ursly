import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class HealthController {
  @GrpcMethod('Health', 'Check')
  check(): any {
    return {
      status: 1, // SERVING
    };
  }

  @GrpcMethod('Health', 'Watch')
  watch(): any {
    return {
      status: 1, // SERVING
    };
  }
}

