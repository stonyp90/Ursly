import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let mockConnection: any;

  beforeEach(async () => {
    mockConnection = {
      readyState: 1, // Connected
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: getConnectionToken(), useValue: mockConnection },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  describe('check', () => {
    it('should return health status', async () => {
      const result = await service.check();

      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(typeof result.uptime).toBe('number');
    });
  });

  describe('ready', () => {
    it('should return ready status when database is connected', async () => {
      const result = await service.ready();

      expect(result.status).toBe('ready');
      expect(result.database).toBe('connected');
      expect(result.timestamp).toBeDefined();
    });

    it('should return not ready status when database is disconnected', async () => {
      mockConnection.readyState = 0;

      const result = await service.ready();

      expect(result.status).toBe('not ready');
      expect(result.database).toBe('disconnected');
    });
  });
});

