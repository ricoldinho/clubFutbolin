import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('concatena clases', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('resuelve conflictos de tailwind-merge', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});
