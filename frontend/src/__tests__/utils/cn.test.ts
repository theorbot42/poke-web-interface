import { describe, it, expect } from 'vitest';
import { cn } from '../../utils/cn';

describe('cn utility', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should resolve tailwind conflicts — last class wins', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('should handle undefined and null gracefully', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('should handle object syntax', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500');
  });

  it('should handle array syntax', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('should return empty string for no arguments', () => {
    expect(cn()).toBe('');
  });
});
