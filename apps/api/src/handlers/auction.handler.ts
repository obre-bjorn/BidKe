import { type Server,type Socket } from "socket.io";
import { AuctionService } from "../services/auction.service.js";
import { QueueService } from "../services/queue.service.js";
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


    socket.on('bid:submit', async (payload: { amount: number, auctionId: string }) => {
    try {
        const userId = (socket as any).user.id;
        const { amount, auctionId } = payload;

        // 1. Database Phase (Fast & Atomic)
        const result = await AuctionService.placeBid(auctionId, amount, userId);

        // 2. Queue Phase (External Network Call - Safe here outside DB lock)
        if (result.isExtended) {
            await QueueService.scheduleAuctionJobs(auctionId, result.updatedAuction.endTime);
            console.log(`🔥 GAME RUSH: Worker updated for ${auctionId}`);
        }

        // 3. Cache Phase
        await redisClient.set(`auction:${auctionId}:currentPrice`, result.updatedAuction.currentPrice.toString());

        // 4. Broadcast Phase
        io.to(auctionId).emit('bid:update', {
            auctionId,
            newPrice: result.updatedAuction.currentPrice,
            bidder: userId,
            endTime: result.updatedAuction.endTime // Send the new time to the frontend!
        });

    } catch (error: any) {
        console.error("Bid Submission Error:", error.message);
        socket.emit('bid:error', { errorMessage: error.message || "Failed to place bid." });
    }
});
}