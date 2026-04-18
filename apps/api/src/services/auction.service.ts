import redisClient from '../lib/redis.js';
import { db } from "@auction/db";

export class AuctionService {



    // static async createAuction(data:{title:string, description:string, startingPrice:number, endTime:Date, imageUrl?:string}){

    //     const auction = await db.auction.create({
    //         data: {
    //             title: data.title,
    //             description: data.description,
    //             startPrice: data.startingPrice,
    //             currentPrice: data.startingPrice,
    //             endTime: data.endTime,
    //             // imageUrl: data.imageUrl
    //         }
    //     })

    //     await redisClient.set(`auction:${auction.id}:currentPrice`, auction.currentPrice.toString())
        
    //     return auction      

    // }

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




    static async placeBid (auctionId:string, amount: number, userId: string) {


        return await db.$transaction(async (tx) => {

            const auction = await tx.auction.findUnique({
                where: {id : auctionId}
            })

            if (!auction) throw new Error("Auction not found!")

            
            if (amount <= auction.currentPrice){
                throw new Error("Bid must be higher than the current price")
            }

            await tx.bid.create({
                data : {
                    amount,
                    auctionId,
                    userId
                }
            })

            const updatedAuction = await tx.auction.update({
                where: {id : auctionId},
                data: {
                    currentPrice: amount
                }
            })


            return {updatedAuction}


        })

    }

    static async closeAuction(auctionId:string){{

        return await db.$transaction(async (tx) => {

            const auction = await tx.auction.findUnique({
                where: {id : auctionId},
                include: {
                    bids: {
                        orderBy: { amount: 'desc' },
                        take: 1
                    }
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
                updatedAuction,
                winner: winningBid
            }

        })

    }}

}
