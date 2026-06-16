import { Worker, Queue } from 'bullmq';
import { AuctionService } from './auction.service.js';

const REDIS_URL = process.env.REDIS_URL; 

if (!REDIS_URL) {
    throw new Error("REDIS_URL is not defined in environment variables");
}

const connectionOptions = {
    connection: {
        url: REDIS_URL,
        tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
        maxRetriesPerRequest: null,
        retryStrategy(times: number) {
            return Math.min(times * 50, 2000);
        },
    },
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 5000, // Keep failed jobs for 5000 entries for debugging
    }
};

export const auctionQueue = new Queue('auction-tasks', connectionOptions);

export class QueueService {
    static async scheduleAuctionJobs(auctionId: string, endTime: Date) {
        const endTs = new Date(endTime).getTime();
        const nowTs = Date.now();

        // 1. Final Closure Job
        await auctionQueue.add('close-auction', { auctionId }, {
            delay: Math.max(0, endTs - nowTs),
            jobId: `close-auction-${auctionId}`,
            removeOnComplete: true,
        });

        // 2. 15-Minute Reminder
        const TIME_REMINDER = 15 * 60 * 1000; 
        const reminderDelay = (endTs - TIME_REMINDER) - nowTs;

        if (reminderDelay > 0) {
            await auctionQueue.add('auction-reminder', 
                { auctionId }, 
                {
                    delay: reminderDelay,
                    jobId: `remind-${auctionId}`,
                }
            );
        }
    }
}

/**
 * Worker Initialization function to be called from index.ts
 * This prevents circular dependencies.
 */
export const initializeWorker = (io: any) => {
    const worker = new Worker('auction-tasks', async (job) => {
        const { auctionId } = job.data;

        if (job.name === "close-auction") {
            // const { auctionId } = job.data;
            const MAX_RETRIES = 3;
            let attempt = 0;

            try {
                while (attempt < MAX_RETRIES) {
                try {
                    const result = await AuctionService.closeAuction(auctionId);

                    if (result?.auction.status === 'SOLD' && result.winner && result.seller) {
                    io.to(`user:${result.winner.id}`).emit('notification', {
                        type: 'AUCTION_WON',
                        message: `Congratulations! You won the auction for ${result.auction.title}!`
                    });

                    io.to(`user:${result.seller.id}`).emit('notification', {
                        type: 'AUCTION_SOLD',
                        message: `Your item ${result.auction.title} was sold for ${result.finalPrice}!`
                    });
                    }

                    io.to(auctionId).emit('auction:ended', {
                    auctionId,
                    winner: result.winner || null,
                    finalPrice: result.auction.currentPrice,
                    status: result.auction.status
                    });

                    console.log(`✅ [Upstash-Worker] Auction ${auctionId} finalized.`);
                    break;

                } catch (err: any) {
                    if (err.code === 'P2028' && attempt < MAX_RETRIES - 1) {
                    attempt++;
                    await new Promise(res => setTimeout(res, 1000 * attempt));
                    } else {
                    throw err;
                    }
                }
                }
            } catch (err) {
                console.error(`❌ [Worker Error] Failed to close auction ${auctionId}:`, err);
                throw err;
            }
        }
                

    

        if (job.name === "auction-reminder") {

            console.log(`🔔 [REMINDER] Auction ${auctionId} ends in 15 minutes!`);

            io.to(auctionId).emit('notification', {

                type: 'URGENT',
                message: "This auction is ending in 15 minutes! Get your bids in."

            });
        }


    }, connectionOptions);

    worker.on('ready', () => console.log("🚀 [Upstash-Worker] Connected and waiting..."));
    worker.on('error', (err) => console.error("❌ [Worker Error] Connection failed:", err));

    return worker;
};