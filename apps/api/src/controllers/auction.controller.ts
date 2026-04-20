import { type Request,type Response } from "express";
import { AuctionService } from "../services/auction.service.js";
import sharp from "sharp";
import cloudinary from "../lib/cloudinary.js";

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
        
        
        const uploadResults = await Promise.all(files.map(async (file) : Promise<UploadedMedia> => {
            
            let category : 'IMAGE' | 'VIDEO' | 'DOC' = 'IMAGE'

            if(file.mimetype.startsWith('video/')){

                category = 'VIDEO'
            }else if(file.mimetype.startsWith('application/pdf')){
                category = 'DOC'
            }

            let buffer = file.buffer

            if(category === 'IMAGE'){
                buffer = await sharp(file.buffer)
                    .resize(1200,1200, {fit: 'inside', withoutEnlargement: true})
                    .jpeg({quality: 80, mozjpeg : true})
                    .toBuffer()
            }

            return new Promise( (resolve, reject) => {

                const isVideo = category === 'VIDEO'

                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder:'auctions',
                        resource_type: isVideo ? 'video' : 'auto',
                        transformation: isVideo ? [{ quality: "auto", fetch_format: "mp4" }] : undefined
                    },(err,res) => {

                        if(err) return reject(err)
                        
                        resolve({
                            url:res?.secure_url || '',
                            publicId: res?.public_id || '',
                            type: category
                        })

                    }
                )

                uploadStream.end(buffer)
            })

        }))

        const auctionData = {
            title: req.body.title,
            description: req.body.description,
            startingPrice: parseFloat(req.body.startPrice),
            endTime: new Date(req.body.endtime),
            media: uploadResults 
        }


        const result = await AuctionService.createAuction(auctionData, adminId)


        res.status(200).json({message:"Auction created Successully", data: result})
    } catch (error: any) {

        console.log("CRITICAL ERROR in auction creation: ",error)

        res.status(500).json({
            error: error.message || "An internal server error occured"
        })
        
    }


}
 

