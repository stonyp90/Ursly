import { renderHook, act } from '@testing-library/react';

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  };
  return {
    io: jest.fn(() => mockSocket),
  };
});

// Mock the useAuth hook
jest.mock('react-oidc-context', () => ({
  useAuth: () => ({
    user: {
      profile: {
        sub: 'user-123',
      },
    },
    isAuthenticated: true,
  }),
}));

describe('useRealtime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize', async () => {
    // Basic test to ensure the module can be imported
    const module = await import('./useRealtime');
    expect(module).toBeDefined();
  });

  it('should export useRealtime hook', async () => {
    const { useRealtime } = await import('./useRealtime');
    expect(useRealtime).toBeDefined();
    expect(typeof useRealtime).toBe('function');
  });
});

