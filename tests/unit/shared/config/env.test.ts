import { describe, it, expect } from 'vitest';
import { schema } from '@/shared/config/env';

describe('env schema', () => {
  it('debe declarar PORT, NODE_ENV y LOG_LEVEL como requeridos', () => {
    // Arrange
    const required = schema.required as string[];

    // Act
    const hasPort = required.includes('PORT');
    const hasNodeEnv = required.includes('NODE_ENV');
    const hasLogLevel = required.includes('LOG_LEVEL');

    // Assert
    expect(hasPort).toBe(true);
    expect(hasNodeEnv).toBe(true);
    expect(hasLogLevel).toBe(true);
  });

  it('debe definir default 3000 para PORT', () => {
    // Arrange
    const portProp = schema.properties?.PORT as { default?: number };

    // Act
    const defaultValue = portProp?.default;

    // Assert
    expect(defaultValue).toBe(3000);
  });
});
