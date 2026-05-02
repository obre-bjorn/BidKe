import redisClient from '../lib/redis.js';
import { db } from "@auction/db";
import { QueueService } from './queue.service.js';



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

    static async getAllAuctions (){


        const result = await db.auction.findMany({
            orderBy: {endTime: 'asc'},
            include:{_count:{select: 
                {bids : true}}
            }
        })

        console.log("Fetched auctions:", result);

        return result

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


    static async getLiveAuctionPrice(auctionId:string) : Promise<number> {
        
        const price = await redisClient.get(`auction:${auctionId}:currentPrice`);

        if (price) {
            return parseFloat(price);
        }

        const auction = await db.auction.findUnique({where: { id: auctionId }})
        const currentPrice = auction?.currentPrice || 0;

        await redisClient.set(`auction:${auctionId}:currentPrice`, currentPrice.toString())

        return currentPrice

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

    static async closeAuction(auctionId:string){{

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

        })

    }}

}
