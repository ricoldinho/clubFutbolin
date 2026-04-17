import { PrismaClient } from '@prisma/client';
import type {
  CreateRefreshTokenSessionInput,
  IRefreshTokenSessionRepository,
  RefreshTokenSession,
} from '@/application/ports/auth/RefreshTokenSession.repository';

export class PrismaRefreshTokenSessionRepository implements IRefreshTokenSessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateRefreshTokenSessionInput): Promise<void> {
    await this.prisma.refreshTokenSession.create({
      data: {
        jti: input.jti,
        family: input.family,
        playerId: input.playerId,
        expiresAt: input.expiresAt,
      },
    });
  }

  async findByJti(jti: string): Promise<RefreshTokenSession | null> {
    const row = await this.prisma.refreshTokenSession.findUnique({
      where: { jti },
      select: {
        jti: true,
        family: true,
        playerId: true,
        expiresAt: true,
        revokedAt: true,
        replacedByJti: true,
        lastUsedAt: true,
      },
    });
    if (row === null) {
      return null;
    }
    return row;
  }

  async rotate(currentJti: string, nextJti: string, nextExpiresAt: Date): Promise<void> {
    const existing = await this.findByJti(currentJti);
    if (existing === null) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.refreshTokenSession.update({
        where: { jti: currentJti },
        data: {
          revokedAt: new Date(),
          replacedByJti: nextJti,
          lastUsedAt: new Date(),
        },
      });
      await tx.refreshTokenSession.create({
        data: {
          jti: nextJti,
          family: existing.family,
          playerId: existing.playerId,
          expiresAt: nextExpiresAt,
        },
      });
    });
  }

  async revokeFamily(family: string): Promise<void> {
    await this.prisma.refreshTokenSession.updateMany({
      where: { family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeByJti(jti: string): Promise<void> {
    await this.prisma.refreshTokenSession.updateMany({
      where: { jti, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
