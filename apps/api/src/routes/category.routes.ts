import { Router} from "express";
import { createCategory, deleteCategory, getAllCategories, getCategoryById, updateCategory } from "../controllers/category.controller.js";
import { authMiddleware, superUserOnly } from "../middleware/auth.middleware.js";

const router = Router();

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.post('/', authMiddleware, superUserOnly, createCategory);
router.put('/:id', authMiddleware, superUserOnly, updateCategory);
router.delete('/:id', authMiddleware, superUserOnly, deleteCategory);

export default router;
