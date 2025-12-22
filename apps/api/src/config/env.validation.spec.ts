import 'reflect-metadata';
import { validate } from './env.validation';

describe('Environment Validation', () => {
  const validEnv = {
    NODE_ENV: 'development',
    PORT: 3000,
    MONGODB_URI: 'mongodb://localhost:27017/test',
    OLLAMA_URL: 'http://localhost:11434',
    AGENT_TOKEN_SECRET: 'test-secret-key-that-is-long-enough',
    AGENT_TOKEN_EXPIRY: 300,
    KEYCLOAK_URL: 'http://localhost:8080',
    KEYCLOAK_REALM: 'agent-orchestrator',
    KEYCLOAK_CLIENT_ID: 'agent-api',
    KEYCLOAK_CLIENT_SECRET: 'test-secret',
    GRPC_SERVICE_URL: 'localhost:50051',
  };

  describe('validate function', () => {
    it('should validate correct environment variables', () => {
      const result = validate(validEnv);
      expect(result).toBeDefined();
      expect(result.PORT).toBe(3000);
    });

    it('should throw for missing required fields', () => {
      const invalidEnv = { ...validEnv };
      delete (invalidEnv as any).MONGODB_URI;

      expect(() => validate(invalidEnv)).toThrow();
    });

    it('should use default PORT when not provided', () => {
      const envWithoutPort = { ...validEnv };
      delete (envWithoutPort as any).PORT;

      const result = validate(envWithoutPort);
      expect(result.PORT).toBe(3000);
    });

    it('should coerce string PORT to number', () => {
      const envWithStringPort = { ...validEnv, PORT: '4000' };

      const result = validate(envWithStringPort);
      expect(result.PORT).toBe(4000);
      expect(typeof result.PORT).toBe('number');
    });

    it('should validate KEYCLOAK_URL as URL', () => {
      const invalidUrl = { ...validEnv, KEYCLOAK_URL: '' };

      expect(() => validate(invalidUrl)).toThrow();
    });

    it('should validate OLLAMA_URL as URL', () => {
      const invalidUrl = { ...validEnv, OLLAMA_URL: '' };

      expect(() => validate(invalidUrl)).toThrow();
    });

    it('should validate AGENT_TOKEN_EXPIRY range (60-3600)', () => {
      const tooLow = { ...validEnv, AGENT_TOKEN_EXPIRY: 30 };
      const tooHigh = { ...validEnv, AGENT_TOKEN_EXPIRY: 5000 };

      expect(() => validate(tooLow)).toThrow();
      expect(() => validate(tooHigh)).toThrow();
    });

    it('should accept valid AGENT_TOKEN_EXPIRY', () => {
      const valid = { ...validEnv, AGENT_TOKEN_EXPIRY: 600 };

      const result = validate(valid);
      expect(result.AGENT_TOKEN_EXPIRY).toBe(600);
    });
  });
});
