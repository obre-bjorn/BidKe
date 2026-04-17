
import {db} from '@auction/db';







async function main() {
  console.log('🚀 Starting seed process...');



  // 1. Create an Admin (The Seller)
  const admin = await db.user.upsert({
    where: { email: 'admin@auction.com' },
    update: {},
    create: {
      username: 'AuctionAdmin',
      email: 'admin@auction.com',
      password: 'hashed_password_123', // In production, use bcrypt
      phone_number: '254700000000',
      role:'ADMIN',
    },
  });

  // 2. Create a regular User (The Bidder)
  const bidder = await db.user.upsert({
    where: { email: 'bidder@test.com' },
    update: {},
    create: {
      username: 'TestBidder',
      email: 'bidder@test.com',
      password: 'hashed_password_456',
      phone_number: '254711111111',
      role: 'USER',
    },
  });

  // 3. Create an Auction (Linked to the Admin)
  const auction = await db.auction.upsert({
    where: { id: 'sample-auction-id' },
    update: {},
    create: {
      id: 'sample-auction-id',
      title: 'Rare Ethereum Collectible',
      description: 'A high-value digital asset for Web3 enthusiasts.',
      startPrice: 100.0,
      currentPrice: 100.0,
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Ends in 7 days
      sellerId: admin.id,
    },
  });

  // 4. Create an Initial Bid
  await db.bid.create({
    data: {
      amount: 150.0,
      auctionId: auction.id,
      userId: bidder.id,
    },
  });

  // 5. Update Auction current price to match the highest bid
  await db.auction.update({
    where: { id: auction.id },
    data: { currentPrice: 150.0 },
  });

  console.log('✅ Seed data created successfully!');
  console.log({
    adminId: admin.id,
    bidderId: bidder.id,
    auctionId: auction.id
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });