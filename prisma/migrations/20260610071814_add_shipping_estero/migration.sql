-- AlterTable
ALTER TABLE "shipping_config" ADD COLUMN     "costEstero" DECIMAL(10,2) NOT NULL DEFAULT 7.90,
ADD COLUMN     "freeThresholdEstero" DECIMAL(10,2) NOT NULL DEFAULT 199.00;
