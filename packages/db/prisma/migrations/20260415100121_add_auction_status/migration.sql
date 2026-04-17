-- CreateEnum
CREATE TYPE "AuctionStatus" AS ENUM ('ACTIVE', 'CLOSED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Auction" ADD COLUMN     "status" "AuctionStatus" NOT NULL DEFAULT 'ACTIVE';
