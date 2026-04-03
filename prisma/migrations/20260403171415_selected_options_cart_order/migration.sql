-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "selectedOptions" JSONB;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "selectedOptions" JSONB;
