// controllers/payment.controller.js
import axios from 'axios';
import { getAuthToken } from '../utils/token.service.js';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import Payment from '../models/payment.model.js';
dotenv.config(); // loads variables from .env into process.env

const stripe = new Stripe(process.env.STRIPE_SECRET); // <-- your API key goes here


export const processUBLPayment = async (req, res, next) => {
  try {
    const { amount, recipient } = req.body;
    const token = await getAuthToken('UBL'); // still using API secret internally

    const response = await axios.post(process.env.UBL_API, { amount, recipient }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    res.status(200).json({ success: true, data: response.data });
  } catch (err) {
    next(err);
  }
};
export const processPayoneerPayment = async (req, res, next) => {
  try {
    const { amount, recipient } = req.body;
    const token = await getAuthToken('PAYONEER');

    const response = await axios.post(process.env.PAYONEER_API, { amount, recipient }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    res.status(200).json({ success: true, data: response.data });
  } catch (err) {
    next(err);
  }
};
export const transferBuyerToSeller = async (req, res, next) => {
  try {
    const { amount, buyerId, sellerId, provider } = req.body;
    const token = await getAuthToken(provider);

    const response = await axios.post(process.env[`${provider}_TRANSFER_API`], {
      amount,
      from: buyerId,
      to: sellerId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    res.status(200).json({ success: true, data: response.data });
  } catch (err) {
    next(err);
  }
};

export const processStripePayment = async (req, res, next) => {
  try {
    const { amount, currency = 'usd', paymentMethodId, description, receipt_email } = req.body;

    if (!amount || !paymentMethodId) {
      return res.status(400).json({ success: false, message: 'Amount and paymentMethodId are required.' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      payment_method: paymentMethodId,
      confirm: true,
      description,
      receipt_email,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never', // avoids redirect issues
      },
    });

    // Save payment to MongoDB
    const paymentDoc = await Payment.create({
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      description: paymentIntent.description,
      paymentMethodId: paymentIntent.payment_method,
      receiptEmail: paymentIntent.receipt_email,
      customerId: paymentIntent.customer,
      metadata: paymentIntent.metadata,
    });

    res.status(200).json({ success: true, data: paymentDoc });
  } catch (err) {
    if (err.type && err.type.startsWith('Stripe')) {
      res.status(402).json({ success: false, message: err.message, stripeError: err });
    } else {
      next(err);
    }
  }
};

/**
 * Refund a payment (full or partial)
 */
export const refundPayment = async (req, res, next) => {
  try {
    const { paymentIntentId, amount } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ success: false, message: 'paymentIntentId is required.' });
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });

    // Update MongoDB
    const payment = await Payment.findOne({ paymentIntentId });
    if (payment) {
      payment.refundedAmount = (payment.refundedAmount || 0) + refund.amount;
      payment.refunds.push({
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status,
        reason: refund.reason,
        created: refund.created,
      });
      await payment.save();
    }

    res.status(200).json({ success: true, data: refund });
  } catch (err) {
    if (err.type && err.type.startsWith('Stripe')) {
      res.status(402).json({ success: false, message: err.message, stripeError: err });
    } else {
      next(err);
    }
  }
};

/**
 * Stripe webhook handler
 * Make sure Express uses raw body parser for this route:
 * app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
 */


export const stripeWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);

    switch (event.type) {
      case 'payment_intent.succeeded':
        const piSucceeded = event.data.object;
        console.log('Payment succeeded:', piSucceeded.id);

        // Update MongoDB status
        await Payment.findOneAndUpdate(
          { paymentIntentId: piSucceeded.id },
          { status: 'succeeded' },
          { new: true }
        );
        break;

      case 'payment_intent.payment_failed':
        const piFailed = event.data.object;
        console.log('Payment failed:', piFailed.id);

        await Payment.findOneAndUpdate(
          { paymentIntentId: piFailed.id },
          { status: 'failed' },
          { new: true }
        );
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook Error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};