import express from 'express';
import {createStripePaymentIntent, refundPayment} from '../controllers/payment.controller.js';
import { createOrderFromCart } from '../controllers/order.controller.js';
import Stripe from "stripe";

const router = express.Router();

//ORDER PAYMENT

//AUCTION PAYMENT

//B2B PAYEMENT

//router.post('/checkout', processStripePayment)
//router.post('/createPaymentIntent', createPaymentIntent)
//router.post('/create-auction-checkout-session', createAuctionCheckoutSession)
//router.post('/create-checkout-session', createCheckoutSession)

router.post('/createOrder', createOrderFromCart)

const stripe = new Stripe(process.env.STRIPE_SECRET_TEST); // test key only!
router.post("/pay-test", async (req, res) => {
  try {
    const { clientSecret } = req.body;
    if (!clientSecret) return res.status(400).json({ error: "Missing client secret" });

    const paymentIntent = await stripe.paymentIntents.confirm(clientSecret, {
      payment_method: "pm_card_visa", // test payment method
      return_url: 'https://example.com/test-complete'
      
    });

    res.status(200).json({
      status: paymentIntent.status,
      id: paymentIntent.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});



router.post('/cpr', async (req, res) => {
  try {
    console.log(req.body);
    
    const data = await createStripePaymentIntent(req.body);
    res.json(data);
  } catch (err) {
    console.error("Error creating payment intent:", err);
    res.status(400).json({ error: err.message });
  }
});





router.post('/refund', refundPayment )
export default router;
