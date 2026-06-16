import { type Response, type Request,type NextFunction } from "express";
import { verifyToken } from "../lib/auth.js";




export const authMiddleware = (req:Request, res:Response, next:NextFunction) => {

    const token = req.headers.authorization?.split(' ')[1];
    
    if(!token){
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = verifyToken(token);
        (req as any).user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }       

}



export const  adminOnly = (req:Request, res:Response, next:NextFunction) => {

    const user = (req as any).user;

    if(user.role !== 'ADMIN' || user.role !== 'SUPERUSER'){
        return res.status(403).json({ message: 'Access denied' });
    }

    next();
}   


export const superUserOnly = (req:Request, res:Response, next:NextFunction) => {

    const user = (req as any).user;

    if(user.role !== 'SUPERUSER'){
        return res.status(403).json({ message: 'Access denied' });
    }
    
    next();
}
