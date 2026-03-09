import { afterEach, vi } from 'vitest';

/**
 * Setup global: tests con mocks en memoria.
 * - No usar DB, red ni disco real en tests unitarios.
 * - Dependencias externas: vi.mock(), vi.fn() o Fakes en tests/doubles/.
 */
afterEach(() => {
  vi.clearAllMocks();
});
