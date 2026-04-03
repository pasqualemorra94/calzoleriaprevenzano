-- CreateTable
CREATE TABLE "VariantTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "config" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VariantTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VariantTemplate_slug_key" ON "VariantTemplate"("slug");

-- CreateIndex
CREATE INDEX "VariantTemplate_slug_idx" ON "VariantTemplate"("slug");

-- CreateIndex
CREATE INDEX "VariantTemplate_isActive_idx" ON "VariantTemplate"("isActive");

-- CreateIndex
CREATE INDEX "VariantTemplate_sortOrder_idx" ON "VariantTemplate"("sortOrder");
