import { type Server,type Socket } from "socket.io";
import { AuctionService } from "../services/auction.service.js";
import { QueueService } from "../services/queue.service.js";
import redisClient from "../lib/redis.js";




export const registerAuctionHandlers = (io: Server, socket: Socket) => {

    socket.on('joinAuction', async (auctionId: string) => {
    
        const livePrice = await AuctionService.getLiveAuctionPrice(auctionId);

        console.log('livePrice:', livePrice);
        
        if (livePrice === null) {
            return socket.emit('auction:error', { message: 'This auction does not exist.' });
        }

        socket.join(auctionId);

    
        socket.emit('auction:sync', {
            auctionId,
            currentPrice: livePrice
        });
    });

    socket.on('leaveAuction', (auctionId: string) => {
        console.log(`Client ${socket.id} left auction ${auctionId}`);
        socket.leave(auctionId);
    });


    socket.on('bid:submit', async (payload: { amount: number, auctionId: string }) => {
    try {
        const userId = (socket as any).user.id;
        const { amount, auctionId } = payload;

        

        // 1. Database Phase (Fast & Atomic)
        const {updatedAuction, isExtended, previousBidderId} = await AuctionService.placeBid(auctionId, amount, userId);
        
        
        // 2. Queue Phase (External Network Call - Safe here outside DB lock)
        if (isExtended) {
            await QueueService.scheduleAuctionJobs(auctionId, updatedAuction.endTime);
            console.log(`🔥 GAME RUSH: Worker updated for ${auctionId}`);
        }

        // 3. Cache Phase
        await redisClient.set(`auction:${auctionId}:currentPrice`, updatedAuction.currentPrice.toString()).catch(err => console.warn('Cache update failed (non-critical):', err.message));;

        // 4. Broadcast Phase
        io.to(auctionId).emit('bid:update', {
            auctionId,
            newPrice: updatedAuction.currentPrice,
            bidder: userId,
            endTime: updatedAuction.endTime // Send the new time to the frontend!
        });

        if (previousBidderId && previousBidderId !== userId) {
            io.to(`user:${previousBidderId}`).emit('notification', {
                type: 'OUTBID',
                message: `You've been outbid on auction ${auctionId}! New price: ${updatedAuction.currentPrice}`,
        });
}

    } catch (error: any) {
        console.error("Bid Submission Error:", error.message);
        socket.emit('bid:error', { errorMessage: error.message || "Failed to place bid." });
    }
});
}