export interface RefreshTokenSession {
  jti: string;
  family: string;
  playerId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByJti: string | null;
  lastUsedAt: Date | null;
}

export interface CreateRefreshTokenSessionInput {
  jti: string;
  family: string;
  playerId: string;
  expiresAt: Date;
}

export interface IRefreshTokenSessionRepository {
  create(input: CreateRefreshTokenSessionInput): Promise<void>;
  findByJti(jti: string): Promise<RefreshTokenSession | null>;
  rotate(currentJti: string, nextJti: string, nextExpiresAt: Date): Promise<void>;
  revokeFamily(family: string): Promise<void>;
  revokeByJti(jti: string): Promise<void>;
}
