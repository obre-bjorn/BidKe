import { Router } from "express";
import { getAllAuctions, getAuctionById} from "../controllers/auction.controller.js";
import { authMiddleware,adminOnly } from "../middleware/auth.middlware.js";

const router = Router();



router.get('/', getAllAuctions);
router.get('/:id', getAuctionById);

export default router;