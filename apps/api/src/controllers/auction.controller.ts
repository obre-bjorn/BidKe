import { type Request,type Response } from "express";
import { AuctionService } from "../services/auction.service.js";


export async function getAllAuctions (req:Request, res:Response) {
    try {

        const auctions = await AuctionService.getAllAuctions();
        res.json(auctions);


    }catch (error) {
        res.status(500).json({error: "Failed to fetch auctions"})
    }



}



export async function getAuctionById (req:Request, res:Response) {
    const id = req.params.id as string;

    try {
        const auction = await AuctionService.getAuctionById(id);

        if (!auction) {
            return res.status(404).json({ error: "Auction not found" });
        }

        res.json(auction);
    } catch (error) {

        res.status(500).json({ error: "Failed to fetch auction details" });

    }
}



export async function createAuction(req:Request, res:Response){

    try {
        
        const adminId =  (req as any).user.id

        const result = AuctionService.createAuctionWithImages(req.body, adminId)



    } catch (error) {
        
    }


}
 

