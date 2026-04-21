import sharp from "sharp";
import cloudinary from "../lib/cloudinary.js";

interface UploadedMedia {
    url: string;
    publicId: string;
    type: 'IMAGE' | 'VIDEO' | 'DOC';
}   


export class MediaService {

    static async processAndUploadMedia(file: Express.Multer.File): Promise<UploadedMedia> {

        let category : 'IMAGE' | 'VIDEO' | 'DOC' = 'IMAGE'
        
        if(file.mimetype.startsWith('video/')){
            category = 'VIDEO'
        } else if (file.mimetype === 'application/pdf' || file.mimetype === 'application/msword' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            category = 'DOC'
        }

        let buffer = file.buffer
        
        if(category === 'IMAGE'){
            buffer = await sharp(file.buffer)
                .resize(1200, 120000, { fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 80, mozjpeg: true })
                .toBuffer()
        }

        return new Promise((resolve, reject) => {

            const isVideo = category === 'VIDEO'? 'video' : 'auto'

            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'auctions',
                    resource_type: isVideo,
                    transformation: isVideo === 'video' ? [{ quality: "auto", fetch_format: "mp4" }] : undefined
                },
                (err, res) => {
                    if (err) return reject(err)

                    resolve({
                        url: res?.secure_url || '',
                        publicId: res?.public_id || '',
                        type: category
                    })
                }
            )

            uploadStream.end(buffer)
        })
    }


    static async deleteMedia(publicIds: string[], type: 'IMAGE' | 'VIDEO' | 'DOC') {
    
        if(publicIds.length === 0) return;

        const resourceType = type === 'VIDEO' ? 'video' : 'image'

        try {
            
            await cloudinary.api.delete_resources(publicIds, {
                resource_type: resourceType
            });

        } catch (error) {
            console.error(`Cloudinary deletion failed for ${type}:`, error);
        }
        
    }
}
