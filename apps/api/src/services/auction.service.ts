import redisClient from '../lib/redis.js';
import { db } from "@auction/db";
import { QueueService } from './queue.service.js';

interface AuctionQueryParams {
    search?: string;
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
}



export class AuctionService {



    static async createAuction(data:{
            title:string, 
            description:string, 
            startingPrice:number, 
            endTime:Date,     
            media: {url:string, publicId:string, type:string}[],
        }, 
        adminId:string){

        return await db.auction.create({
        data: {
            title: data.title,
            description: data.description,
            startPrice: data.startingPrice,
            currentPrice: data.startingPrice,
            endTime: new Date(data.endTime),
            sellerId: adminId,
            status: 'ACTIVE',
            // This replaces createMany and the transaction wrapper
            media: {
                create: data.media.map((m: any) => ({
                    url: m.url,
                    publicId: m.publicId,
                    mediaType: m.type as any,
                }))
            }
        },
        include: {
            media: true // Returns the media in the response immediately
        }
    });

    }

    static async getAllAuctions(params: AuctionQueryParams) {
        const { 
            search, 
            category, 
            status = 'ACTIVE', // Default to showing only active auctions
            page = 1, 
            limit = 12 // 12 items per page fits nicely into 2, 3, or 4-column grids
        } = params;

        const skip = (page - 1) * limit;

        // Build dynamic Prisma query filters
        const whereClause: any = {
            status: status
        };

        // Add search filter if present (case-insensitive)
        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Add category filter if present
        if (category) {
            whereClause.category = category;
        }

        // Run count query and data query in parallel to speed things up
        const [totalItems, auctions] = await db.$transaction([
            db.auction.count({ where: whereClause }),
            db.auction.findMany({
                where: whereClause,
                skip: skip,
                take: limit,
                orderBy: { endTime: 'asc' }, // Urgent auctions first
                select: {
                    id: true,
                    title: true,
                    currentPrice: true,
                    endTime: true,
                    category: true,
                    media: true, // For showing the thumbnail image
                    status: true
                }
            })
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        return {
            auctions,
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            }
        };
    }


    static async deleteAuction(auctionId:string, adminId:string){

        return await db.$transaction(async (tx) => {

            const auction = await tx.auction.findUnique({
                where: { id: auctionId },
                include: { media: true }
            });


            if (!auction) throw new Error("Auction not found");
            if (auction.sellerId !== adminId) throw new Error("Unauthorized");

            await tx.auction.delete({
                where: { id: auctionId }
            });


            return auction.media;

        })


    }

    static async getAuctionById (auctionId:string) {
        
        const result = await db.auction.findUnique({
            where: { id: auctionId },
            include: {
                bids: {
                orderBy: { createdAt: 'desc' },
                take: 5 // Get the 5 most recent bids for the "Live Feed"
                },
                _count: {
                select: { bids: true }
                }
            }
        });

        return result;
    }


    static async getLiveAuctionPrice(auctionId:string) : Promise<number | null> {
        
        const price = await redisClient.get(`auction:${auctionId}:currentPrice`);
        if (price) return parseFloat(price);

        // Fetch from DB if not in Redis
        const auction = await db.auction.findUnique({ where: { id: auctionId } });
        
        // If auction is null, return null!
        if (!auction) return null;

        const currentPrice = auction.currentPrice;
        await redisClient.set(`auction:${auctionId}:currentPrice`, currentPrice.toString());

        return currentPrice;

    } 




    static async placeBid(auctionId: string, amount: number, userId: string) {
        return await db.$transaction(async (tx) => {


        
            const [auction] = await tx.$queryRaw<any[]>`
                            SELECT a.*, 
                                    (SELECT "userId" FROM "Bid" 
                                    WHERE "auctionId" = a.id 
                                    ORDER BY amount DESC 
                                    LIMIT 1) as "topBidderId"
                            FROM "Auction" a
                            WHERE a.id = ${auctionId}
                            FOR UPDATE
                            `


            if (!auction) throw new Error("Auction not found");

            if (auction.sellerId === userId) {
                throw new Error("You cannot bid on your own auction!");
            }

            if (auction.status !== "ACTIVE") throw new Error("Auction is no longer active");
            if (amount <= auction.currentPrice) throw new Error("Bid must be higher than current price");

            // Capture this BEFORE updating the auction
            const previousBidderId = auction.topBidderId || null; 

            const RUSH_THRESHOLD = 60 * 1000;
            const now = Date.now();
            const timeRemaining = auction.endTime.getTime() - now;

            let finalEndTime = auction.endTime;
            let isExtended = false;

            if (timeRemaining <= RUSH_THRESHOLD) {
                finalEndTime = new Date(now + 60000); 
                isExtended = true;
            }

            await tx.bid.create({ data: { amount, userId, auctionId } });
            
            const updatedAuction = await tx.auction.update({
                where: { id: auctionId },
                data: { 
                    currentPrice: amount, 
                    endTime: finalEndTime,
                }
            });

            return { updatedAuction, isExtended, previousBidderId };
        }, { timeout: 10000 });
    }

    static async closeAuction(auctionId:string){

        return await db.$transaction(async (tx) => {

            const auction = await tx.auction.findUnique({
                where: {id : auctionId},
                include: {
                    bids: {
                        orderBy: { amount: 'desc' },
                        take: 1,
                        include:{User : true}
                    },
                    seller:true
                }
            })


            if (!auction) throw new Error("Auction not found!")

            if (auction.status !== "ACTIVE") throw new Error("Auction is not active!")
            
            const winningBid = auction.bids[0]
            const newStatus = winningBid ? "SOLD" : "EXPIRED"


            const updatedAuction = await tx.auction.update({
                where:{
                    id : auctionId
                },
                data :{
                    status : newStatus
                }
            })


            return {
                auction: updatedAuction,
                winner: winningBid? auction.bids[0].User : null,
                seller: auction.seller,
                finalPrice: winningBid?.amount || null
            }

        },{ timeout: 15000 , maxWait: 10000 })

    }


    static async getUserDashboard(userId: string) {
        // 1. Fetch auctions the user is SELLING
        const listings = await db.auction.findMany({
            where: { sellerId: userId },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { bids: true } }
            }
        });

        // 2. Fetch auctions the user has BID ON (Buying)
        // We get distinct auctions to avoid duplicates if they bid multiple times
        const distinctBids = await db.bid.findMany({
            where: { userId },
            distinct: ['auctionId'],
            include: {
                auction: {
                    include: {
                        bids: {
                            orderBy: { amount: 'desc' },
                            take: 1 // Get the highest bid to check who is winning
                        }
                    }
                }
            }
        });

        // 3. Process the "Buying" data to determine standing (WINNING vs OUTBID)
        const buying = distinctBids
            .filter(b => b.auction.status === 'ACTIVE')
            .map(b => {
                const highestBid = b.auction.bids[0];
                const isHighest = highestBid?.userId === userId;

                return {
                    id: b.auction.id,
                    title: b.auction.title,
                    currentPrice: b.auction.currentPrice,
                    myLastBid: b.amount,
                    endTime: b.auction.endTime,
                    standing: isHighest ? 'WINNING' : 'OUTBID'
                };
            });

        // 4. Process the "Won" data (Auctions that are SOLD where this user was the highest bidder)
        const won = distinctBids
            .filter(b => b.auction.status === 'SOLD')
            .filter(b => b.auction.bids[0]?.userId === userId)
            .map(b => ({
                id: b.auction.id,
                title: b.auction.title,
                finalPrice: b.auction.currentPrice,
                closedAt: b.auction.endTime
            }));

        return {
            listings: listings.map(l => ({
                id: l.id,
                title: l.title,
                currentPrice: l.currentPrice,
                status: l.status,
                endTime: l.endTime,
                totalBids: l._count.bids
            })),
            buying,
            won
        };
    }
}


