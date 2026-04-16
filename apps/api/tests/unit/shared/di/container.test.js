"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const JoseJwtService_1 = require("@/adapters/auth/JoseJwtService");
const container_1 = require("@/shared/di/container");
(0, vitest_1.describe)('buildContainer', () => {
    (0, vitest_1.it)('debe registrar prisma y servicios base en el cradle', () => {
        // Arrange
        const prisma = {};
        const container = (0, container_1.buildContainer)({
            prisma,
            config: {
                PORT: 3000,
                NODE_ENV: 'test',
                LOG_LEVEL: 'silent',
                JWT_SECRET: 'secret-for-tests',
                JWT_EXPIRES_IN: '1h',
                JWT_REFRESH_EXPIRES_IN: '14d',
                CORS_ORIGINS: '*',
                RATE_LIMIT_MAX: 100,
                RATE_LIMIT_WINDOW_MS: 60000,
                AUTH_RATE_LIMIT_MAX: 10,
                AUTH_RATE_LIMIT_WINDOW_MS: 60000,
                AUTH_ACCESS_COOKIE_NAME: 'clubfutbolin_at',
                AUTH_REFRESH_COOKIE_NAME: 'clubfutbolin_rt',
                AUTH_ACCESS_COOKIE_MAX_AGE_SEC: 900,
                AUTH_REFRESH_COOKIE_MAX_AGE_SEC: 1209600,
                AUTH_COOKIE_SAME_SITE: 'lax',
                AUTH_COOKIE_SECURE: false,
            },
        });
        // Act
        const cradle = container.cradle;
        // Assert
        (0, vitest_1.expect)(cradle.prisma).toBe(prisma);
        (0, vitest_1.expect)(cradle.playerRepository).toBeDefined();
        (0, vitest_1.expect)(cradle.leagueRepository).toBeDefined();
        (0, vitest_1.expect)(cradle.teamRepository).toBeDefined();
        (0, vitest_1.expect)(cradle.seasonRepository).toBeDefined();
        (0, vitest_1.expect)(cradle.rosterRepository).toBeDefined();
        (0, vitest_1.expect)(cradle.passwordHasher).toBeDefined();
        (0, vitest_1.expect)(cradle.jwtService).toBeInstanceOf(JoseJwtService_1.JoseJwtService);
        (0, vitest_1.expect)(cradle.jwtService.getExpiresIn()).toBe('1h');
    });
    (0, vitest_1.it)('debe reutilizar singletons y separar scoped por scope', () => {
        // Arrange
        const container = (0, container_1.buildContainer)({
            prisma: {},
            config: {
                PORT: 3000,
                NODE_ENV: 'test',
                LOG_LEVEL: 'silent',
                JWT_SECRET: 'secret-for-tests',
                JWT_EXPIRES_IN: '1h',
                JWT_REFRESH_EXPIRES_IN: '14d',
                CORS_ORIGINS: '*',
                RATE_LIMIT_MAX: 100,
                RATE_LIMIT_WINDOW_MS: 60000,
                AUTH_RATE_LIMIT_MAX: 10,
                AUTH_RATE_LIMIT_WINDOW_MS: 60000,
                AUTH_ACCESS_COOKIE_NAME: 'clubfutbolin_at',
                AUTH_REFRESH_COOKIE_NAME: 'clubfutbolin_rt',
                AUTH_ACCESS_COOKIE_MAX_AGE_SEC: 900,
                AUTH_REFRESH_COOKIE_MAX_AGE_SEC: 1209600,
                AUTH_COOKIE_SAME_SITE: 'lax',
                AUTH_COOKIE_SECURE: false,
            },
        });
        const scopeA = container.createScope();
        const scopeB = container.createScope();
        // Act
        const repoInA = scopeA.cradle.playerRepository;
        const repoInB = scopeB.cradle.playerRepository;
        const listPlayersA1 = scopeA.cradle.listPlayers;
        const listPlayersA2 = scopeA.cradle.listPlayers;
        const listPlayersB1 = scopeB.cradle.listPlayers;
        // Assert
        (0, vitest_1.expect)(repoInA).toBe(repoInB);
        (0, vitest_1.expect)(listPlayersA1).toBe(listPlayersA2);
        (0, vitest_1.expect)(listPlayersA1).not.toBe(listPlayersB1);
    });
    (0, vitest_1.it)('debe resolver todos los casos de uso registrados en el container', () => {
        // Arrange
        const container = (0, container_1.buildContainer)({
            prisma: {},
            config: {
                PORT: 3000,
                NODE_ENV: 'test',
                LOG_LEVEL: 'silent',
                JWT_SECRET: 'secret-for-tests',
                JWT_EXPIRES_IN: '1h',
                JWT_REFRESH_EXPIRES_IN: '14d',
                CORS_ORIGINS: '*',
                RATE_LIMIT_MAX: 100,
                RATE_LIMIT_WINDOW_MS: 60000,
                AUTH_RATE_LIMIT_MAX: 10,
                AUTH_RATE_LIMIT_WINDOW_MS: 60000,
                AUTH_ACCESS_COOKIE_NAME: 'clubfutbolin_at',
                AUTH_REFRESH_COOKIE_NAME: 'clubfutbolin_rt',
                AUTH_ACCESS_COOKIE_MAX_AGE_SEC: 900,
                AUTH_REFRESH_COOKIE_MAX_AGE_SEC: 1209600,
                AUTH_COOKIE_SAME_SITE: 'lax',
                AUTH_COOKIE_SECURE: false,
            },
        });
        const scope = container.createScope();
        // Act
        const resolvedUseCases = {
            loginPlayer: scope.cradle.loginPlayer,
            registerPlayer: scope.cradle.registerPlayer,
            listPlayers: scope.cradle.listPlayers,
            getPlayerById: scope.cradle.getPlayerById,
            updatePlayer: scope.cradle.updatePlayer,
            deletePlayer: scope.cradle.deletePlayer,
            createLeague: scope.cradle.createLeague,
            updateLeague: scope.cradle.updateLeague,
            deleteLeague: scope.cradle.deleteLeague,
            listLeagues: scope.cradle.listLeagues,
            getLeagueById: scope.cradle.getLeagueById,
            createTeam: scope.cradle.createTeam,
            updateTeam: scope.cradle.updateTeam,
            deleteTeam: scope.cradle.deleteTeam,
            listTeams: scope.cradle.listTeams,
            getTeamByName: scope.cradle.getTeamByName,
            createSeason: scope.cradle.createSeason,
            listSeasons: scope.cradle.listSeasons,
            getSeasonById: scope.cradle.getSeasonById,
            setSeasonWinners: scope.cradle.setSeasonWinners,
            registerTeamToSeason: scope.cradle.registerTeamToSeason,
            addPlayerToRoster: scope.cradle.addPlayerToRoster,
            removePlayerFromRoster: scope.cradle.removePlayerFromRoster,
        };
        // Assert
        Object.values(resolvedUseCases).forEach((value) => {
            (0, vitest_1.expect)(value).toBeDefined();
        });
    });
});
