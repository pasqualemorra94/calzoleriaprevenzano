-- CreateTable
CREATE TABLE "AiSession" (
    "id" TEXT NOT NULL,
    "label" TEXT,
    "footImage" TEXT NOT NULL,
    "footProfile" JSONB NOT NULL,
    "suggestions" JSONB,
    "analysisCost" DOUBLE PRECISION,
    "tryonImageUrl" TEXT,
    "tryonProductId" TEXT,
    "tryonCreditsUsed" INTEGER,
    "tryonCostUsd" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiSession_createdAt_idx" ON "AiSession"("createdAt");
