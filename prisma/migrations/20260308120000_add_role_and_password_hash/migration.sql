-- CreateEnum
CREATE TYPE "PlayerRole" AS ENUM ('USER', 'ADMIN');

-- AlterTable: add role with default USER
ALTER TABLE "Player" ADD COLUMN "role" "PlayerRole" NOT NULL DEFAULT 'USER';

-- AlterTable: add passwordHash. Existing rows get a placeholder so they must reset password to login.
ALTER TABLE "Player" ADD COLUMN "passwordHash" TEXT NOT NULL DEFAULT 'MIGRATION_PLACEHOLDER_NO_LOGIN';

-- Remove default so new rows must provide passwordHash
ALTER TABLE "Player" ALTER COLUMN "passwordHash" DROP DEFAULT;
