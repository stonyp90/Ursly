import { CreateAgentSchema } from './create-agent.dto';

describe('CreateAgentSchema', () => {
  it('should validate valid agent data', () => {
    const validData = {
      name: 'Test Agent',
      model: 'llama2',
      systemPrompt: 'You are a helpful assistant',
    };

    const result = CreateAgentSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const invalidData = {
      name: '',
      model: 'llama2',
      systemPrompt: 'You are a helpful assistant',
    };

    const result = CreateAgentSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject missing required fields', () => {
    const invalidData = {
      name: 'Test Agent',
    };

    const result = CreateAgentSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should accept optional capabilities', () => {
    const validData = {
      name: 'Test Agent',
      model: 'llama2',
      systemPrompt: 'You are a helpful assistant',
      capabilities: ['text-generation', 'summarization'],
    };

    const result = CreateAgentSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});

