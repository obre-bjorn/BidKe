// apps/api/src/controllers/user.controller.ts
import {type Request, type Response } from 'express';
import { AuctionService } from '../services/auction.service.js';

export const getDashboardData = async (req: Request, res: Response) => {
    try {
        // Ensure your auth middleware is populating req.user!
        const userId = (req as any).user?.id; 
        
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const data = await AuctionService.getUserDashboard(userId);
        return res.json(data);
    } catch (error) {
        console.error("Dashboard Error:", error);
        return res.status(500).json({ message: "Failed to retrieve dashboard data" });
    }
};