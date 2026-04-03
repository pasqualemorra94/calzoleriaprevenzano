-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "guestEmail" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "guestEmail" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;
