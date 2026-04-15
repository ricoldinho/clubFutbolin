import { describe, it, expect } from 'vitest';
import { INSECURE_JWT_SECRETS, schema } from '@/shared/config/env';

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

  it('debe exigir credenciales JWT en el schema', () => {
    // Arrange
    const required = schema.required as string[];

    // Act
    const hasJwtSecret = required.includes('JWT_SECRET');
    const hasJwtExpires = required.includes('JWT_EXPIRES_IN');
    const hasJwtRefreshExpires = required.includes('JWT_REFRESH_EXPIRES_IN');

    // Assert
    expect(hasJwtSecret).toBe(true);
    expect(hasJwtExpires).toBe(true);
    expect(hasJwtRefreshExpires).toBe(true);
  });

  it('debe definir default 3000 para PORT', () => {
    // Arrange
    const portProp = schema.properties?.PORT as { default?: number };

    // Act
    const defaultValue = portProp?.default;

    // Assert
    expect(defaultValue).toBe(3000);
  });

  it('debe definir CORS_ORIGINS con localhost por defecto', () => {
    // Arrange
    const corsOriginsProp = schema.properties?.CORS_ORIGINS as { default?: string };

    // Act
    const defaultValue = corsOriginsProp?.default;

    // Assert
    expect(defaultValue).toBe(
      'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173',
    );
  });

  it('debe incluir defaults para rate limit global y auth', () => {
    // Arrange
    const rateLimitMax = schema.properties?.RATE_LIMIT_MAX as { default?: number };
    const rateLimitWindow = schema.properties?.RATE_LIMIT_WINDOW_MS as { default?: number };
    const authRateLimitMax = schema.properties?.AUTH_RATE_LIMIT_MAX as { default?: number };
    const authRateLimitWindow = schema.properties?.AUTH_RATE_LIMIT_WINDOW_MS as {
      default?: number;
    };

    // Act
    const defaults = {
      rateLimitMax: rateLimitMax?.default,
      rateLimitWindow: rateLimitWindow?.default,
      authRateLimitMax: authRateLimitMax?.default,
      authRateLimitWindow: authRateLimitWindow?.default,
    };

    // Assert
    expect(defaults).toEqual({
      rateLimitMax: 200,
      rateLimitWindow: 60000,
      authRateLimitMax: 10,
      authRateLimitWindow: 60000,
    });
  });

  it('debe incluir defaults de JWT refresh y cookies de auth', () => {
    // Arrange
    const jwtRefreshExpires = schema.properties?.JWT_REFRESH_EXPIRES_IN as { default?: string };
    const accessCookieName = schema.properties?.AUTH_ACCESS_COOKIE_NAME as { default?: string };
    const refreshCookieName = schema.properties?.AUTH_REFRESH_COOKIE_NAME as { default?: string };
    const accessCookieMaxAge = schema.properties?.AUTH_ACCESS_COOKIE_MAX_AGE_SEC as {
      default?: number;
    };
    const refreshCookieMaxAge = schema.properties?.AUTH_REFRESH_COOKIE_MAX_AGE_SEC as {
      default?: number;
    };
    const cookieSameSite = schema.properties?.AUTH_COOKIE_SAME_SITE as { default?: string };
    const cookieSecure = schema.properties?.AUTH_COOKIE_SECURE as { default?: boolean };

    // Act
    const defaults = {
      jwtRefreshExpires: jwtRefreshExpires?.default,
      accessCookieName: accessCookieName?.default,
      refreshCookieName: refreshCookieName?.default,
      accessCookieMaxAge: accessCookieMaxAge?.default,
      refreshCookieMaxAge: refreshCookieMaxAge?.default,
      cookieSameSite: cookieSameSite?.default,
      cookieSecure: cookieSecure?.default,
    };

    // Assert
    expect(defaults).toEqual({
      jwtRefreshExpires: '14d',
      accessCookieName: 'clubfutbolin_at',
      refreshCookieName: 'clubfutbolin_rt',
      accessCookieMaxAge: 900,
      refreshCookieMaxAge: 1209600,
      cookieSameSite: 'lax',
      cookieSecure: false,
    });
  });

  it('debe incluir secretos JWT inseguros conocidos para bloquearlos en producción', () => {
    // Arrange
    const legacySecret = 'dev-secret-change-in-production';
    const templateSecret = 'dev-secret-change-in-production-1234567890';

    // Act
    const hasLegacy = INSECURE_JWT_SECRETS.has(legacySecret);
    const hasTemplate = INSECURE_JWT_SECRETS.has(templateSecret);

    // Assert
    expect(hasLegacy).toBe(true);
    expect(hasTemplate).toBe(true);
  });
});
