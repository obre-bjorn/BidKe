import { createServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import express, { type Request, type Response } from 'express';
import { type AuctionItem, APP_NAME } from '@auction/shared';
import { registerAuctionHandlers } from './handlers/auction.handler.js';
import { verifyToken } from './lib/auth.js';

// Route imports
import auctionRouters from './routes/auction.routes.js'
import authRouters from './routes/auth.routes.js'

import { initializeWorker } from './services/queue.service.js';


// Server Setup
const app = express();
const httpServer = createServer(app)
export const io = new Server(httpServer, {
    cors : {
        origin : "*",
    }
})

app.use(cors({
  origin: "http://localhost:3000", // Replace with your frontend URL
  methods: ["GET", "POST"],
  credentials: true
}));


app.use(express.urlencoded({extended:false}))
app.use(express.json());



// REST API Endpoints
app.get('/', (req: Request, res: Response) => {
  res.send(`Welcome to ${APP_NAME} API!`);
})


app.use('/auctions',auctionRouters)
app.use('/auth',authRouters)



// SOCKET API


io.use((socket, next) => {
    // Socket.io provides 'auth' field specifically for this
    
    const token: string = socket.handshake.headers.token;

    if (!token) {
        return next(new Error("Authentication error: Token missing"));
    }

    try {
        const decoded = verifyToken(token);
        // Attach user to the socket instance
        (socket as any).user = decoded;
        next();
    } catch (err) {
        next(new Error("Authentication error: Invalid token"));
    }
});

io.on('connection', (socket) => {

    const userId = (socket as any).user?.id; 
    if (userId) {
        // 2. Join a private room unique to this user ID
        // We use the prefix 'user:' to keep it clean
        socket.join(`user:${userId}`);
        console.log(`👤 User ${userId} connected and joined room: user:${userId}`);
    }

    registerAuctionHandlers(io,socket)



    
});




// Ensure the queue worker is initialized

const PORT = 4000;
httpServer.listen(PORT, () => {

    initializeWorker(io)
  console.log(`✅ [${APP_NAME}] Running on Node 25`);
  console.log(`🚀 API & Sockets: http://localhost:${PORT}`);
});