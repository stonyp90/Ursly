import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController (gRPC)', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('check', () => {
    it('should return SERVING status', () => {
      const result = controller.check();

      expect(result).toEqual({ status: 1 });
    });
  });

  describe('watch', () => {
    it('should return SERVING status', () => {
      const result = controller.watch();

      expect(result).toEqual({ status: 1 });
    });
  });
});

