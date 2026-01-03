import Stripe from 'stripe';
import Payment from '../models/payment.model.js';
import Order from '../models/order.model.js';
import { Auction } from "../models/auction.model.js";
import userModel from '../models/user.model.js';
import jwt from 'jsonwebtoken';


const stripe = new Stripe(process.env.STRIPE_SECRET);
export const createPaymentIntent = async (order) => {
  try {
    const amount = Math.round(order.totalSalePrice * 100);

    if (!order || !order._id) {
      throw new Error("Invalid order provided for payment intent creation.");
    }

    // Create Stripe PaymentIntent (without confirming)
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: { orderId: order._id.toString() }, // Use the order ID from the object
      automatic_payment_methods: { enabled: true, allow_redirects: "never" }
    });

    // Instead of returning a response, we return the data needed by the caller.
    return {
      clientSecret: paymentIntent.client_secret,
      amount: amount / 100,
      currency: paymentIntent.currency
    };

  } catch (err) {
    console.error("Create PaymentIntent error:", err);
    // Re-throw the error so the calling function's catch block can handle it
    throw err; 
  }
};

export async function createAuctionPaymentIntent(auctionOrder) {
  try {
    const auctionId = auctionOrder.auctionId;
    const auction = await Auction.findById(auctionId);
    if (!auction) throw new Error("Auction not found");

    const winner = auction.winnerId;
    if (!winner) throw new Error("No winner for this auction");

    const user = await userModel.findById(winner);
    if (!user) throw new Error("Winner user not found");

    let email;
    if (user.role !== "buyer") {
      email = user.email;
    } else {
      email = user.businessEmail;
    }

    const amount = Math.round(auction.highestBid * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: { auctionOrderId: auctionOrder._id.toString() },
      receipt_email: email,
      description: `Auction win - ${auction.title}`,
      automatic_payment_methods: { enabled: true }
    });

    await Payment.create({
      paymentIntentId: paymentIntent.id,
      amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      description: `Auction win - ${auction.title}`,
      receipt_email: email,
      paymentType: "Auction", // ✅ Add this line
      metadata: { auctionId: auctionId.toString() }
    });


    return {
      clientSecret: paymentIntent.client_secret,
      currency: paymentIntent.currency
    };
  } catch (err) {
    console.error("Auction payment error:", err);
    throw err;
  }
}

const tierAmounts = {
    essential: {
      amount: 5000,
      duration:"3 months"
    }, // $50.00
    premium: {
      amount:7500,
      duration:"6 months"
    }, // $75.00
    enterprise: {
      amount: 10000,
      duration:"12 months"
    }, // $100.00
};

export async function createB2BOrder(req, res) {
    try {
        const { tier } = req.body;
        const token = req.cookies.user_token;
        if (!token) return res.status(401).json({ error: "Unauthorized" });
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'HammerBidMart' });
        } catch {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await userModel.findById(decoded.id);
        if (!user) return res.status(404).json({ error: "Account doesn't exist. Can't upgrade." });
        if (user.role !== 'seller') return res.status(403).json({ error: "Only sellers can upgrade to a B2B membership." });

        if (user.b2bVerified){
            return res.status(400).json({ error: "You are already a B2B member." });
        }

        const amountInCents = tierAmounts[tier]?.amount;
        if (!amountInCents) return res.status(400).json({ error: "Invalid tier specified." });

        // assume user.stripeCustomerId exists
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'usd',
            description: `B2B Tier ${tier} one-time payment`,
            metadata: { userId: user._id.toString(), tier: tier.toString() },
        });

        return res.json({
            clientSecret: paymentIntent.client_secret,
            userId: user._id,
            tier: tier,
            tierDetails: tierAmounts[tier]
        });

    } catch (error) {
        console.error('Failed to create B2B order:', error);
        return res.status(500).json({ error: error.message });
    }
}

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

      // Update order status if fully refunded
      if (payment.refundedAmount >= payment.amount) {
        await Order.findByIdAndUpdate(payment.orderId, { status: 'refunded' });
      }
    }

    res.status(200).json({ success: true, data: refund });
  } catch (err) {
    if (err.type && err.type.startsWith('Stripe')) {
      res.status(402).json({ success: false, message: err.message, stripeError: err });
    } else {
      res.status(500).json({ success: false, message: err.message || "Refund failed" });
    }
  }
};







////////New Payment Functions Here
// utils/stripeUtils.js

////USES REAL MONEY SWAP KEY BEFORE TESTING
const testStripe = new Stripe(process.env.STRIPE_SECRET); 
export async function createStripePaymentIntent({
  amount,                     // in cents
  currency = "usd",
  description = "",
  metadata = {},
  receipt_email = null,
  saveToDB = false,
  paymentType = null,
  PaymentModel = null,        // optional Mongoose model for persistence
}) {
  try {
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error("Invalid payment amount.");
    }

    // Create PaymentIntent
    const paymentIntent = await testStripe.paymentIntents.create({
      amount,
      currency,
      description,
      metadata,
      ...(receipt_email && { receipt_email }),
      automatic_payment_methods: { enabled: true },
    });

    // Optionally save to DB
    if (saveToDB && PaymentModel) {
      await PaymentModel.create({
        paymentIntentId: paymentIntent.id,
        amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        description,
        receipt_email,
        paymentType,
        metadata,
      });
    }

    // Return minimal data for the caller
    return {
      clientSecret: paymentIntent.client_secret,
      amount: amount / 100,
      currency: paymentIntent.currency,
      paymentIntentId: paymentIntent.id,
    };

  } catch (err) {
    console.error("Stripe PaymentIntent error:", err);
    throw err;
  }
}
