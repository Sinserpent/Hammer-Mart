import express from 'express';
import { createSale } from "../controllers/sales.controller.js"
//import { sellLimiter } from '../middleware/rate.middleware.js';



const router = express.Router();

router.post('/cart', createSale)



export default router;
