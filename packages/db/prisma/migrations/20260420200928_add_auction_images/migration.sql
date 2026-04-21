/*
  Warnings:

  - You are about to drop the `AuctionImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Media" AS ENUM ('IMAGE', 'VIDEO', 'DOC');

-- DropForeignKey
ALTER TABLE "AuctionImage" DROP CONSTRAINT "AuctionImage_auctionId_fkey";

-- DropTable
DROP TABLE "AuctionImage";

-- CreateTable
CREATE TABLE "AuctionMedia" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "mediaType" "Media" NOT NULL DEFAULT 'IMAGE',
    "auctionId" TEXT NOT NULL,

    CONSTRAINT "AuctionMedia_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AuctionMedia" ADD CONSTRAINT "AuctionMedia_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
