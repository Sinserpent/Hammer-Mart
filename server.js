//Lib Imports
import express from 'express';
import morgan from "morgan";
import "dotenv/config"
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import http from 'http';
import connectDB from './config/db.js';
import cookieParser from "cookie-parser";
import cron from "node-cron";

//Routes 
//USER AND ADMIN
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import adminRouter from './routes/admin.routes.js';
import adminUserRouter from './routes/admin.user.routes.js'
import subAdmin from './routes/sub.admin.routes.js' //NEW ROUTE
import employeeRouter from './routes/employee.routes.js' //NEW ROUTE

//PRODUCT ROUTES(INV)
import productUpload from './routes/product.routes.js';
import b2bRoutes from './routes/b2b.routes.js'
import productAuction from './routes/auction.routes.js';

//ALIEXPRESS DOPSHIPPING ROUTES
import aliExpressAuth from './routes/aliexpressAuth.routes.js'
import aliExpress from './routes/aliexpress.routes.js'

//ORDER AND PAYMENT HANDLER
import paymentRoutes from './routes/payment.routes.js'
import auctionPayment from './routes/auction.payment.js'
import order from './routes/order.route.js'

//BACKUP ROUTES
import { runBackup } from "./utils/backup.js";

//MISC ROUTES
import { initAuctionScheduler } from './middleware/auction.scheduler.js';
import notificationRouter from "./routes/notification.routes.js"
import { globalErrorHandler } from './middleware/error.handler.js';
import cartRoutes from './routes/cart.routes.js';
import contactUs from './controllers/query.controller.js'
import fetchAll from './routes/fetchAll.routes.js';
import reviewRoutes from './routes/review.routes.js';
import { stripeWebhook } from './controllers/webhook.controller.js';
import { initializeB2BScheduler } from './middleware/b2b.scheduler.js';
import { getDiscountedProducts, getVerifiedUsers, getAllAuctionOrders, exportProducts, getAllInquiries, getInquiriesById, exportUser, sellerMessage } from './routes/extraFetch.routes.js'; //NEW ROUTE
import profile from "./routes/profile.routes.js"
import careerRoutes from './routes/career.routes.js'; //New

//STAR ROUTES
import starRoutes from './routes/star.routes.js';
import employeeModel from './models/employee.model.js';

//SOCKETS
import auctionSocket from './sockets/auction.socket.events.js'; 

connectDB();

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  process.env.CLIENT_URL    // your "other client"
  ];
console.log(process.env.CLIENT_URL)
// Express CORS
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};


// Socket.IO CORS
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

//SECURITY MIDDLEWARE
app.use(morgan("dev"));
app.use(helmet())

app.use(rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 500, // limit each IP to 500 requests per window
  message: { error: 'Too many requests, please try again later.' }
}));


app.use(express.json());
app.use(cookieParser());
app.set("trust proxy", 1);
app.use(express.urlencoded({ extended: true }));

// ROUTES

//USER AND ADMIN ROUTES
app.use("/api/auth", authRouter); //ALL ROUTES ARE WORKING MAEK SURE SECURE AND SITE SAME WORK FINE
app.use('/api/user', userRouter) //COMPLETE
app.use("/api/admin", adminRouter); //COMPLETE
app.use("/api/adminUser", adminUserRouter); //COMPLETE

//NEW EMPLOYEE ROUTES
app.use("/api/employee", employeeRouter); //NEW

//MAIN UPLOAD ROUTES
app.use('/api/product', productUpload); //COMPLETE
app.use('/api/auction', productAuction); //COMPLETE
app.use('/api/aliexpress', aliExpress) //COMPLETE
app.use('/api/b2b',b2bRoutes) //COMPLETE

//MAIN FETCH ROUTES 
app.use('/api/fetchAll', fetchAll) //COMPLETE
app.use("/api/getdiscounted", getDiscountedProducts); //NEW APP USE

app.use('/api/cart', cartRoutes) //COMPLETE
app.use('/api/reviews', reviewRoutes) //COMPLETE
app.use('/api/aliexpress/auth', aliExpressAuth) //COMPLETE NEED BUTTON ON FRONT
app.use('/api/order', order);  //COMPLETE
app.use('/api/contact', contactUs) //COMPLETE

//MAIN DAHSHBOARD ROUTES
app.use("/api/getverifiedusers", getVerifiedUsers);
app.use("/api/getauctionorders", getAllAuctionOrders);
app.use("/api/getAllInquiries", getAllInquiries);
app.use("/api/getInquiriesById", getInquiriesById);
app.use('/api/career', careerRoutes);

//STAR ROUTES
app.use('/api/redirect', starRoutes);

//SELLER STORE ROUTES
app.use("/api/getUserData/:id", exportUser); //NEW APP USE
app.use("/api/getsellerproducts/:id", exportProducts);
app.use("/api/sellerMessage", sellerMessage); //NEW APP USE

//PROFILE ROUTES
app.use("/api/profile", profile)

//PAYMENT AND WEBHOOK ROUTES
app.use('/api/webhook', stripeWebhook);  //COMPLETE
app.use('/api/payment', paymentRoutes) //COMPLETE
app.use('/api/auction/payment', auctionPayment) //COMPLETE

//SUBADMIN ROUTES
app.use('/api/subadmin', subAdmin); //NEW ROUTE

//BACKUP ROUTES
app.use('/api/backup', runBackup); //COMPLETE

app.use("/api/notifications", notificationRouter)


app.get("/", (req, res) => {
  res.send("IM ALIVEEEE");
});

//Socket.IO
app.set('io', io);
auctionSocket(io);
io.on('connection_error', (err) => {
  console.error('Socket connection error:', err);
});
const agenda = initAuctionScheduler(io, process.env.MONGODB_URL);
const b2bAgenda = initializeB2BScheduler(process.env.MONGODB_URL);
//Error Handler 
app.use(globalErrorHandler);

// Backup Route


cron.schedule("0 0 */7 * *", async () => {
  try {
    console.log("Running scheduled Mongo backup…");
    const result = await runBackup();
    console.log(result);
  } catch (err) {
    console.error("Backup failed:", err.message);
  }
});

cron.schedule("0 0 * * *", async () => {
  try {
    console.log("Running daily star conversion");

    const employees = await employeeModel.find({ starPoints: { $gte: 1000 } });

    for (const emp of employees) {
      const starsToAdd = Math.floor(emp.starPoints / 1000);

      emp.stars += starsToAdd;
      emp.starPoints -= starsToAdd * 1000;

      await emp.save();
    }

    console.log("Star conversion complete");
  } catch (err) {
    console.error("Star conversion failed:", err.message);
  }
});

cron.schedule("0 0 */2 * *", async () => {
  try {
    await EmployeeReference.updateMany(
      {},
      { $set: { adminMessages: {} } }
    );

    console.log("Admin messages cleared");
  } catch (err) {
    console.error("Cron error:", err);
  }
});

console.log("Server + backup cron ready.");


//Server Start
console.log('PORT:', process.env.PORT);
const PORT = process.env.PORT || 3000;
server.listen(3000,"0.0.0.0", () => console.log(`🚀 Server on ${PORT}`)); 
