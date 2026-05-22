-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'POSP');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "pospId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_pospId_key" ON "User"("pospId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_pospId_fkey" FOREIGN KEY ("pospId") REFERENCES "Posp"("id") ON DELETE SET NULL ON UPDATE CASCADE;
