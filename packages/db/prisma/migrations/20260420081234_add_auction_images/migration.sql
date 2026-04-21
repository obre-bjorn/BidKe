-- CreateTable
CREATE TABLE "AuctionImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,

    CONSTRAINT "AuctionImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AuctionImage" ADD CONSTRAINT "AuctionImage_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
