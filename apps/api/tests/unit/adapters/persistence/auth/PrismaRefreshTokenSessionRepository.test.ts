import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaRefreshTokenSessionRepository } from '@/adapters/persistence/auth/PrismaRefreshTokenSessionRepository';

describe('PrismaRefreshTokenSessionRepository', () => {
  const mockCreate = vi.fn();
  const mockFindUnique = vi.fn();
  const mockUpdate = vi.fn();
  const mockUpdateMany = vi.fn();
  const mockTransaction = vi.fn();

  const mockPrisma = {
    refreshTokenSession: {
      create: mockCreate,
      findUnique: mockFindUnique,
      update: mockUpdate,
      updateMany: mockUpdateMany,
    },
    $transaction: mockTransaction,
  };

  let repository: PrismaRefreshTokenSessionRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaRefreshTokenSessionRepository(mockPrisma as never);
  });

  it('create persiste la sesión de refresh token', async () => {
    // Arrange
    const expiresAt = new Date('2030-01-01T00:00:00.000Z');

    // Act
    await repository.create({
      jti: '11111111-1111-4111-8111-111111111111',
      family: '22222222-2222-4222-8222-222222222222',
      playerId: '33333333-3333-4333-8333-333333333333',
      expiresAt,
    });

    // Assert
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        jti: '11111111-1111-4111-8111-111111111111',
        family: '22222222-2222-4222-8222-222222222222',
        playerId: '33333333-3333-4333-8333-333333333333',
        expiresAt,
      },
    });
  });

  it('findByJti devuelve null cuando no existe', async () => {
    // Arrange
    mockFindUnique.mockResolvedValue(null);

    // Act
    const result = await repository.findByJti('11111111-1111-4111-8111-111111111111');

    // Assert
    expect(result).toBeNull();
  });

  it('rotate revoca sesión actual y crea la nueva en transacción', async () => {
    // Arrange
    const currentJti = '11111111-1111-4111-8111-111111111111';
    const nextJti = '22222222-2222-4222-8222-222222222222';
    const nextExpiresAt = new Date('2030-01-02T00:00:00.000Z');
    mockFindUnique.mockResolvedValue({
      jti: currentJti,
      family: 'aaaaaaa1-1111-4111-8111-111111111111',
      playerId: 'bbbbbbb2-2222-4222-8222-222222222222',
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      revokedAt: null,
      replacedByJti: null,
      lastUsedAt: null,
    });
    mockTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<void>) =>
      callback({
        refreshTokenSession: {
          update: mockUpdate,
          create: mockCreate,
        },
      }),
    );

    // Act
    await repository.rotate(currentJti, nextJti, nextExpiresAt);

    // Assert
    expect(mockTransaction).toHaveBeenCalledOnce();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { jti: currentJti },
      data: {
        revokedAt: expect.any(Date),
        replacedByJti: nextJti,
        lastUsedAt: expect.any(Date),
      },
    });
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        jti: nextJti,
        family: 'aaaaaaa1-1111-4111-8111-111111111111',
        playerId: 'bbbbbbb2-2222-4222-8222-222222222222',
        expiresAt: nextExpiresAt,
      },
    });
  });

  it('rotate no ejecuta transacción cuando el jti actual no existe', async () => {
    // Arrange
    mockFindUnique.mockResolvedValue(null);

    // Act
    await repository.rotate(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      new Date('2030-01-02T00:00:00.000Z'),
    );

    // Assert
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('revokeFamily actualiza todas las sesiones activas de una familia', async () => {
    // Arrange
    const family = '11111111-1111-4111-8111-111111111111';

    // Act
    await repository.revokeFamily(family);

    // Assert
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { family, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('revokeByJti revoca una sesión concreta cuando sigue activa', async () => {
    // Arrange
    const jti = '11111111-1111-4111-8111-111111111111';

    // Act
    await repository.revokeByJti(jti);

    // Assert
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { jti, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
