-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('H', 'W', 'C');

-- CreateTable
CREATE TABLE "Posp" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "joined" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Posp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "pospId" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "policy" TEXT NOT NULL,
    "sum" DOUBLE PRECISION NOT NULL,
    "premium" DOUBLE PRECISION NOT NULL,
    "coa" DOUBLE PRECISION NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "status" "DealStatus" NOT NULL,
    "expected" TIMESTAMP(3) NOT NULL,
    "proposal" TEXT NOT NULL,
    "policyNo" TEXT NOT NULL DEFAULT '',
    "issued" TIMESTAMP(3),
    "remarks" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Posp_code_key" ON "Posp"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Posp_email_key" ON "Posp"("email");

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_pospId_fkey" FOREIGN KEY ("pospId") REFERENCES "Posp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
