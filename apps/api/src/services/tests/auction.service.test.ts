import { describe, it, expect, beforeEach } from 'vitest';
import { AuctionService } from '../auction.service.js';
import { db } from  "@auction/db";

describe('AuctionService', () => {

  
  it('Should get all auctions', async () => {
    

    // 1. Create a dummy auction
    const auction = await db.auction.create({
      data: { title: "Laptop", currentPrice: 500, startPrice: 500, endTime: new Date() }
    });

    // 2. Try to bid $400
    await expect(AuctionService.getAllAuctions()).toBeTruthy();
  });




  it('should reject a bid lower than current price', async () => {
    
    

    // 1. Create a dummy auction
    const auction = await db.auction.create({
      data: { title: "Laptop", currentPrice: 500, startPrice: 500, endTime: new Date() }
    });

    // 2. Try to bid $400
    await expect(AuctionService.placeBid(auction.id, 400))
      .rejects.toThrow("Bid must be higher than the current price");
  });

  it('should update the price on a valid bid', async () => {
    const auction = await db.auction.create({
      data: { title: "Phone", currentPrice: 100, startPrice: 100, endTime: new Date() }
    });

    const updated = await AuctionService.placeBid(auction.id, 200);
    expect(updated.currentPrice).toBe(200);
  });

  it('should handle two simultaneous bids correctly', async () => {
    const auction = await db.auction.create({
      data: { title: "Race Condition Test", currentPrice: 100, startPrice: 100, endTime: new Date() }
    });
  
    // Fire two bids at the same millisecond
    const results = await Promise.allSettled([
      AuctionService.placeBid(auction.id, 150),
      AuctionService.placeBid(auction.id, 150)
    ]);
  
    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');
  
    // One should succeed, one should fail
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
  });

});
