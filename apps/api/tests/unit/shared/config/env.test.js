"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const env_1 = require("@/shared/config/env");
(0, vitest_1.describe)('env schema', () => {
    (0, vitest_1.it)('debe declarar PORT, NODE_ENV y LOG_LEVEL como requeridos', () => {
        // Arrange
        const required = env_1.schema.required;
        // Act
        const hasPort = required.includes('PORT');
        const hasNodeEnv = required.includes('NODE_ENV');
        const hasLogLevel = required.includes('LOG_LEVEL');
        // Assert
        (0, vitest_1.expect)(hasPort).toBe(true);
        (0, vitest_1.expect)(hasNodeEnv).toBe(true);
        (0, vitest_1.expect)(hasLogLevel).toBe(true);
    });
    (0, vitest_1.it)('debe exigir credenciales JWT en el schema', () => {
        // Arrange
        const required = env_1.schema.required;
        // Act
        const hasJwtSecret = required.includes('JWT_SECRET');
        const hasJwtExpires = required.includes('JWT_EXPIRES_IN');
        const hasJwtRefreshExpires = required.includes('JWT_REFRESH_EXPIRES_IN');
        // Assert
        (0, vitest_1.expect)(hasJwtSecret).toBe(true);
        (0, vitest_1.expect)(hasJwtExpires).toBe(true);
        (0, vitest_1.expect)(hasJwtRefreshExpires).toBe(true);
    });
    (0, vitest_1.it)('debe definir default 3000 para PORT', () => {
        // Arrange
        const portProp = env_1.schema.properties?.PORT;
        // Act
        const defaultValue = portProp?.default;
        // Assert
        (0, vitest_1.expect)(defaultValue).toBe(3000);
    });
    (0, vitest_1.it)('debe definir CORS_ORIGINS con localhost por defecto', () => {
        // Arrange
        const corsOriginsProp = env_1.schema.properties?.CORS_ORIGINS;
        // Act
        const defaultValue = corsOriginsProp?.default;
        // Assert
        (0, vitest_1.expect)(defaultValue).toBe('http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173');
    });
    (0, vitest_1.it)('debe incluir defaults para rate limit global y auth', () => {
        // Arrange
        const rateLimitMax = env_1.schema.properties?.RATE_LIMIT_MAX;
        const rateLimitWindow = env_1.schema.properties?.RATE_LIMIT_WINDOW_MS;
        const authRateLimitMax = env_1.schema.properties?.AUTH_RATE_LIMIT_MAX;
        const authRateLimitWindow = env_1.schema.properties?.AUTH_RATE_LIMIT_WINDOW_MS;
        // Act
        const defaults = {
            rateLimitMax: rateLimitMax?.default,
            rateLimitWindow: rateLimitWindow?.default,
            authRateLimitMax: authRateLimitMax?.default,
            authRateLimitWindow: authRateLimitWindow?.default,
        };
        // Assert
        (0, vitest_1.expect)(defaults).toEqual({
            rateLimitMax: 200,
            rateLimitWindow: 60000,
            authRateLimitMax: 10,
            authRateLimitWindow: 60000,
        });
    });
    (0, vitest_1.it)('debe incluir defaults de JWT refresh y cookies de auth', () => {
        // Arrange
        const jwtRefreshExpires = env_1.schema.properties?.JWT_REFRESH_EXPIRES_IN;
        const accessCookieName = env_1.schema.properties?.AUTH_ACCESS_COOKIE_NAME;
        const refreshCookieName = env_1.schema.properties?.AUTH_REFRESH_COOKIE_NAME;
        const accessCookieMaxAge = env_1.schema.properties?.AUTH_ACCESS_COOKIE_MAX_AGE_SEC;
        const refreshCookieMaxAge = env_1.schema.properties?.AUTH_REFRESH_COOKIE_MAX_AGE_SEC;
        const cookieSameSite = env_1.schema.properties?.AUTH_COOKIE_SAME_SITE;
        const cookieSecure = env_1.schema.properties?.AUTH_COOKIE_SECURE;
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
        (0, vitest_1.expect)(defaults).toEqual({
            jwtRefreshExpires: '14d',
            accessCookieName: 'clubfutbolin_at',
            refreshCookieName: 'clubfutbolin_rt',
            accessCookieMaxAge: 900,
            refreshCookieMaxAge: 1209600,
            cookieSameSite: 'lax',
            cookieSecure: false,
        });
    });
    (0, vitest_1.it)('debe incluir secretos JWT inseguros conocidos para bloquearlos en producción', () => {
        // Arrange
        const legacySecret = 'dev-secret-change-in-production';
        const templateSecret = 'dev-secret-change-in-production-1234567890';
        // Act
        const hasLegacy = env_1.INSECURE_JWT_SECRETS.has(legacySecret);
        const hasTemplate = env_1.INSECURE_JWT_SECRETS.has(templateSecret);
        // Assert
        (0, vitest_1.expect)(hasLegacy).toBe(true);
        (0, vitest_1.expect)(hasTemplate).toBe(true);
    });
});
