-- CreateTable
CREATE TABLE "shipping_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "cost" DECIMAL(10,2) NOT NULL DEFAULT 7.90,
    "freeThreshold" DECIMAL(10,2) NOT NULL DEFAULT 99.00,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "shipping_config_pkey" PRIMARY KEY ("id")
);
