import {Worker, Queue} from 'bullmq';
import { AuctionService } from './auction.service.js';
import { io } from '../index.js';


const REDIS_URL = process.env.REDIS_URL; 

if (!REDIS_URL) {
    throw new Error("REDIS_URL is not defined in environment variables");
}

// BullMQ needs a standard connection object or string
const connectionOptions = {
    connection: {
        url: REDIS_URL,
        // Upstash often requires specific settings for BullMQ to avoid connection drops
        tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
    },
    // Crucial for BullMQ performance
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
    }
};


console.log("Worker Script Loaded. Initializing BullMQ...");

export const auctionQueue = new Queue('auction-tasks', connectionOptions);

const worker = new Worker('auction-tasks', async (job) => {
  if (job.name === 'close-auction') {
    const { auctionId } = job.data;
    
    try {
        const result = await AuctionService.closeAuction(auctionId);
        
        io.to(auctionId).emit('auction:ended', {
            auctionId,
            winner: result.winner?.userId || null,
            finalPrice: result.updatedAuction.currentPrice,
            status: result.updatedAuction.status
        });

        console.log(`[Upstash-Worker] Auction ${auctionId} finalized.`);
    } catch (err) {
        console.error(`[Worker Error] Failed to close auction ${auctionId}:`, err);
    }
  }
}, connectionOptions);

worker.on('ready', () => {
    console.log("🚀 [Upstash-Worker] Connected and waiting for jobs...");
});


worker.on('error', (err) => {
    console.error("❌ [Worker Error] Connection failed:", err);
});