-- CreateEnum
CREATE TYPE "PlayerCategory" AS ENUM ('CUARTA', 'TERCERA', 'SEGUNDA', 'PRIMERA', 'ELITE');

-- CreateTable
CREATE TABLE "Player" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "nickname" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "league" TEXT[],
    "birthdate" TIMESTAMP(3) NOT NULL,
    "category" "PlayerCategory" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_email_key" ON "Player"("email");
