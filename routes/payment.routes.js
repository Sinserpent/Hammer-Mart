// routes/payment.routes.js
import express from 'express';
import { processUBLPayment, processPayoneerPayment, transferBuyerToSeller, processStripePayment, refundPayment } from '../controllers/payment.controller.js';
import { validatePaymentBody } from '../middleware/validatePayment.js';


const router = express.Router();

router.post('/ubl', validatePaymentBody, processUBLPayment);
router.post('/payoneer', validatePaymentBody, processPayoneerPayment);
router.post('/transfer', validatePaymentBody, transferBuyerToSeller);
router.post('/test', processStripePayment)
router.post('/test2', refundPayment )
export default router;
