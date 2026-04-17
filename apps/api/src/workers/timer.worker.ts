import { AuctionService } from "../services/auction.service.js";
import { type Server } from "socket.io";
import { db } from "@auction/db";


export const startAuctionTimer = (io:Server) => {
    

    // TO DO: OPTIMIZE THE TIMER AND CLOSE AUCTION ON TIME
    console.log("Auction timer started!")


    setInterval(async ()=>{

        
        try {
            const now = new Date()
            
            const expiredAuctions = await db.auction.findMany({
                where: {
                    endTime: {
                        lte: now 
                    },
                    status : "ACTIVE"
                }
            })


            for (const auction of expiredAuctions) {

                const result = await AuctionService.closeAuction(auction.id)

                if (result) {
                    // Tell everyone in that specific room the auction is over!
                    io.to(auction.id).emit('auction:ended', {
                        auctionId: auction.id,
                        winner: result.winner?.userId || null,
                        finalPrice: result.updatedAuction.currentPrice
                    });
            
                    console.log(`🏁 Auction ${auction.id} closed. Status: ${result.updatedAuction.status}`);
                }
            }




        } catch (error) {
            console.log("Timer error: "+ error)
        }



    },5000)




}