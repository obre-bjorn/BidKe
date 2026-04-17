import { type Server,type Socket } from "socket.io";
import { AuctionService } from "../services/auction.service.js";
import redisClient from "../lib/redis.js";




export const registerAuctionHandlers = (io: Server, socket: Socket) => {

    socket.on('joinAuction', async (auctionId: string) => {
        console.log(`Client ${socket.id} joined auction ${auctionId}`);
        socket.join(auctionId);

        // Optionally, send the current auction price to the newly joined client
        const currentPrice = await AuctionService.getLiveAuctionPrice(auctionId);
        socket.emit('currentPrice', { auctionId, currentPrice });
    });

    socket.on('leaveAuction', (auctionId: string) => {
        console.log(`Client ${socket.id} left auction ${auctionId}`);
        socket.leave(auctionId);
    });


    socket.on('bid:submit',async (payload: {amount:number, auctionId:string}) =>{


        try {

            const userId = (socket as any).user.id; // Assuming user info is attached to socket in auth middleware
            
            const { amount, auctionId} = payload;
            
            const currentLivePrice = await AuctionService.getLiveAuctionPrice(auctionId);

            if (amount <= currentLivePrice) {
                socket.emit('bid:error', { errorMessage: "Bid must be higher than current price" });
                return;
            }

            const result = await AuctionService.placeBid(auctionId, amount, userId);

            await redisClient.set(`auction:${auctionId}:currentPrice`, result.updatedAuction.currentPrice.toString());

            console.log(`Bidding on room: ${auctionId}`);
            const rooms = io.sockets.adapter.rooms.get(auctionId);
            console.log(`Users currently in this room: ${rooms ? rooms.size : 0}`);
            
            io.to(auctionId).emit('bid:update', {
                auctionId,
                newPrice: result.updatedAuction.currentPrice,
                bidder: userId
            });


        } catch (error) {
            socket.emit('bid:error', { errorMessage: "Failed to place bid. Please try again." });
        }


    }) 
}