import express from 'express';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';
import auctionRoomSocket from './sockets/auction.socket.events.js';
import connectDB from './config/db.js';
import bidderRoutes from './routes/bidder.routes.js';
import productUpload from './routes/cdn.routes.js';
import seller from './routes/seller.routes.js';
import productAuction from './routes/auction.routes.js';
import cors from 'cors'

dotenv.config();
connectDB();

const app = express();
app.use(cors({ origin: process.env.SOCKET_LINK }))
app.use(express.json());

// Simple test route
app.get('/', (req, res) => {
  res.send('🛒 Hammer Mart API is live!');
});

app.use('/api/bidder', bidderRoutes);
app.use('/api/seller', seller);
app.use('/api/upload', productUpload);
app.use('/api/auction', productAuction);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Store io so controllers can use it
app.set('io', io);

// Init socket listeners
auctionRoomSocket(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));
