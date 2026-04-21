import { Router } from "express";
import { createAuction, deleteAuction, getAllAuctions, getAuctionById} from "../controllers/auction.controller.js";
import { authMiddleware,adminOnly } from "../middleware/auth.middlware.js";
import { upload } from "../middleware/upload.middlware.js";


const router = Router();



router.get('/', getAllAuctions);
router.get('/:id', getAuctionById);
router.post('/',authMiddleware, adminOnly, upload.array('media',10),createAuction )
router.delete('/:id',authMiddleware,adminOnly,deleteAuction)



export default router;