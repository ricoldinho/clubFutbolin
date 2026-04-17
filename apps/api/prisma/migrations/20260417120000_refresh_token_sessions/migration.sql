-- CreateTable
CREATE TABLE "RefreshTokenSession" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "jti" UUID NOT NULL,
    "family" UUID NOT NULL,
    "playerId" UUID NOT NULL,
    "replacedByJti" UUID,
    "revokedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    CONSTRAINT "RefreshTokenSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshTokenSession_jti_key" ON "RefreshTokenSession"("jti");

-- CreateIndex
CREATE INDEX "RefreshTokenSession_playerId_idx" ON "RefreshTokenSession"("playerId");

-- CreateIndex
CREATE INDEX "RefreshTokenSession_family_idx" ON "RefreshTokenSession"("family");

-- AddForeignKey
ALTER TABLE "RefreshTokenSession"
ADD CONSTRAINT "RefreshTokenSession_playerId_fkey"
FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
