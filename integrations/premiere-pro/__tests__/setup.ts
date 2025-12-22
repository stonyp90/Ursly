/**
 * Jest Test Setup
 * Configures the test environment for Premiere Pro UXP plugin tests
 */

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock console methods to reduce noise during tests
const originalConsole = { ...console };
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock TextEncoder/TextDecoder for streaming tests
global.TextEncoder = class TextEncoder {
  encode(str: string): Uint8Array {
    return new Uint8Array(Buffer.from(str, 'utf-8'));
  }
} as unknown as typeof TextEncoder;

global.TextDecoder = class TextDecoder {
  decode(buffer: BufferSource): string {
    if (buffer instanceof ArrayBuffer) {
      return Buffer.from(buffer).toString('utf-8');
    }
    return Buffer.from(buffer as Uint8Array).toString('utf-8');
  }
} as unknown as typeof TextDecoder;

// Mock AbortController
global.AbortController = class AbortController {
  signal: AbortSignal;
  
  constructor() {
    this.signal = {
      aborted: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onabort: null,
      reason: undefined,
      throwIfAborted: jest.fn(),
    } as unknown as AbortSignal;
  }
  
  abort(): void {
    (this.signal as { aborted: boolean }).aborted = true;
  }
};

// Mock AbortSignal.timeout
(AbortSignal as { timeout?: (ms: number) => AbortSignal }).timeout = (ms: number): AbortSignal => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
});

// Clean up after tests
afterEach(() => {
  document.body.innerHTML = '';
});

export { localStorageMock };


