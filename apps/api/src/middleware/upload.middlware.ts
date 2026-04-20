import multer from "multer";


const storage = multer.memoryStorage()



export const upload =  multer({
    storage,
    limits:{fileSize:50 * 1024 * 1024 }, //50MB
    fileFilter: (req,file,cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
        if(allowed.includes(file.mimetype)){
            cb(null,true)
        }else{
            cb(new Error('Invalid file type. Only images and MP4/MOV videos are allowed.') as any, false)
        }
    }
})