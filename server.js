import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import http from 'http';
import connectDB from './config/db.js';
import cors from 'cors'

//Routes
import { sellerRouter, bidderRouter } from './routes/user.routes.js'
import productUpload from './routes/product.routes.js';
import productAuction from './routes/auction.routes.js';
import { globalErrorHandler } from './middleware/error.handler.js';
import paymentRoutes from './routes/payment.routes.js'
import sale from './routes/sale.route.js'
import { initAuctionScheduler } from './middleware/auction.schduler.js';
import aliExpressAuth from './routes/aliexpressAuth.routes.js'
import aliExpress from './routes/aliexpress.routes.js'
import debugRoutes from "./routes/tokenTest.js"
import notificationRouter from "./routes/notification.routes.js"

//Webhooks
//import dsersWebhook from './webhooks/dsers.webhook.js'
//Sockets
import auctionRoomSocket from './sockets/auction.socket.events.js'; 

//Constant

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
//CORS for REST API
app.use(cors({ origin: process.env.SOCKET_LINK, credentials: true }));
//CORS for Socket
const io = new Server(server, { cors: { origin: 
  process.env.SOCKET_LINK,
  methods: ['GET', 'POST'],
  credentials: true } });
  
//SECURITY MIDDLEWARE
app.use(helmet())
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // limit each IP to 100 requests per window
  message: { error: 'Too many requests, please try again later.' }
}));

//Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/seller', sellerRouter)
app.use('/api/bidder', bidderRouter)
app.use('/api/product', productUpload);
app.use('/api/auction', productAuction);
app.use('/api/payment', paymentRoutes)
app.use('/api/checkout', sale);
app.use('/api/aliexpress/auth', aliExpressAuth)
app.use('/api/aliexpress', aliExpress)
app.use("/debug", debugRoutes);
app.use("/api/notifications", notificationRouter)
app.post('/api/test', express.json(), (req, res) => {
  console.log('Received data:', req.body);
  res.json({ status: 'ok', received: req.body });
});





app.get("/", (req, res) => {
  res.send("hello shahzaib");
});



//Socket.IO
app.set('io', io);
auctionRoomSocket(io);
io.on('connection_error', (err) => {
  console.error('Socket connection error:', err);
});
const agenda = initAuctionScheduler(io, process.env.MONGO_URI);

//Error Handler
app.use(globalErrorHandler);

//Server Start
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server on ${PORT}`));
