import { cn } from './utils';

describe('cn (className utility)', () => {
  it('should merge class names', () => {
    const result = cn('bg-red-500', 'text-white');
    expect(result).toContain('bg-red-500');
    expect(result).toContain('text-white');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toContain('base-class');
    expect(result).toContain('active-class');
  });

  it('should handle falsy values', () => {
    const result = cn('base-class', false, null, undefined, 'another-class');
    expect(result).toContain('base-class');
    expect(result).toContain('another-class');
    expect(result).not.toContain('false');
    expect(result).not.toContain('null');
  });

  it('should merge tailwind classes correctly', () => {
    const result = cn('p-4', 'p-8');
    // twMerge should keep only the last padding value
    expect(result).toBe('p-8');
  });

  it('should handle array inputs', () => {
    const result = cn(['bg-blue-500', 'text-white']);
    expect(result).toContain('bg-blue-500');
    expect(result).toContain('text-white');
  });

  it('should handle object inputs', () => {
    const result = cn({ 'bg-red-500': true, 'bg-blue-500': false });
    expect(result).toContain('bg-red-500');
    expect(result).not.toContain('bg-blue-500');
  });

  it('should return empty string for empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });
});

