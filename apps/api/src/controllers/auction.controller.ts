import { type Request,type Response } from "express";
import { AuctionService } from "../services/auction.service.js";
import { MediaService } from "../services/media.service.js";
import sharp from "sharp";
import cloudinary from "../lib/cloudinary.js";
import { QueueService } from "../services/queue.service.js";

interface UploadedMedia {
    url: string;
    publicId: string;
    type: 'IMAGE' | 'VIDEO' | 'DOC';
}


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
        const files = req.files as Express.Multer.File[]

        if(!files || files.length === 0 ) return res.status(400).json({error: "Media requried"})
        
        
        const uploadResults = await Promise.all(
            files.map(async file => MediaService.processAndUploadMedia(file))
        )

        const auctionData = {
            title: req.body.title,
            description: req.body.description,
            startingPrice: parseFloat(req.body.startPrice),
            endTime: new Date(req.body.endTime),
            media: uploadResults 
        }


        const result = await AuctionService.createAuction(auctionData, adminId)

        if(result){

            await QueueService.scheduleAuctionJobs(result.id, result.endTime)
        }

        res.status(201).json({message:"Auction created Successully", data: result})


    } catch (error: any) {

        console.log("CRITICAL ERROR in auction creation: ",error)

        res.status(500).json({
            error: error.message || "An internal server error occured"
        })
        
    }


}


export async function deleteAuction(req:Request, res:Response){

    try {

        const id = req.params.id as string;
        const adminId = (req as any).user.id

        const deletedMedia = await AuctionService.deleteAuction(id, adminId);

        const imageIds = deletedMedia.filter(m => m.mediaType === 'IMAGE').map(m => m.publicId);
        const videoIds = deletedMedia.filter(m => m.mediaType === 'VIDEO').map(m => m.publicId);
        const docIds = deletedMedia.filter(m => m.mediaType === 'DOC').map(m => m.publicId);

        Promise.all([
            MediaService.deleteMedia(imageIds, 'IMAGE'),
            MediaService.deleteMedia(videoIds, 'VIDEO'),
            MediaService.deleteMedia(docIds, 'DOC')
        ]);


        res.status(200).json({ message: "Auction and associated media deleted successfully." })

    } catch (error:any) {


        res.status(error.message === "Unauthorized" ? 403 : 500).json({ 
            error: error.message || "Failed to delete auction" 
        });
    }



}
 

