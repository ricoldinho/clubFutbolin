import { describe, it, expect } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { JoseJwtService } from '@/adapters/auth/JoseJwtService';
import { buildContainer } from '@/shared/di/container';

describe('buildContainer', () => {
  it('debe registrar prisma y servicios base en el cradle', () => {
    // Arrange
    const prisma = {} as PrismaClient;
    const container = buildContainer({
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
    expect(cradle.prisma).toBe(prisma);
    expect(cradle.playerRepository).toBeDefined();
    expect(cradle.leagueRepository).toBeDefined();
    expect(cradle.teamRepository).toBeDefined();
    expect(cradle.seasonRepository).toBeDefined();
    expect(cradle.rosterRepository).toBeDefined();
    expect(cradle.passwordHasher).toBeDefined();
    expect(cradle.jwtService).toBeInstanceOf(JoseJwtService);
    expect(cradle.jwtService.getExpiresIn()).toBe('1h');
  });

  it('debe reutilizar singletons y separar scoped por scope', () => {
    // Arrange
    const container = buildContainer({
      prisma: {} as PrismaClient,
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
    expect(repoInA).toBe(repoInB);
    expect(listPlayersA1).toBe(listPlayersA2);
    expect(listPlayersA1).not.toBe(listPlayersB1);
  });

  it('debe resolver todos los casos de uso registrados en el container', () => {
    // Arrange
    const container = buildContainer({
      prisma: {} as PrismaClient,
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
      expect(value).toBeDefined();
    });
  });
});

