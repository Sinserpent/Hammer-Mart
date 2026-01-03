import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import AuctionOrder from "../models/auction.order.js";
import {Auction} from "../models/auction.model.js";
import userModel from "../models/user.model.js";
import { createAuctionPaymentIntent } from "./payment.controller.js";

export async function createAuctionOrder(req, res) {
  const token = req.cookies.user_token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "HammerBidMart",
    });
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }

  let customerEmail, customerName, customerId;
  const user = await userModel.findById(decoded.id);
  if (!user) throw new Error("User not found");

  customerId = decoded.id;
  if (user.role === "seller") {
    customerEmail = user.businessEmail;
    customerName = user.fullName;
  } else if (user.role === "buyer") {
    customerEmail = user.email;
    customerName = user.fullName;
  } else {
    throw new Error(`Unsupported role: ${user.role}`);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params; // <-- grab from URL

    console.log("Creating order for auctionId:", id);
    const auction = await Auction.findById(id).session(session);
    if (!auction) throw new Error("Auction not found");
    if (!auction.winnerId || auction.winnerId.toString() !== customerId) {
      throw new Error("You are not the winner of this auction");
    }

    const winnerId = auction.winnerId;
    if (!winnerId) return res.status(400).json({ message: "No winner for this auction" });

    const winner = await userModel.findById(winnerId);
    if (!winner) return res.status(404).json({ message: "Winner user not found" });
    if (winner.role === "seller") {
      customerEmail = winner.businessEmail;
      customerName = winner.fullName;
    } else if (winner.role === "buyer") {
      customerEmail = winner.email;
      customerName = winner.fullName;
    } else {
      throw new Error(`Unsupported role: ${winner.role}`);
    }

    if (auction.paymentStatus === "paid") {
      throw new Error("Auction has already been paid for.");
    }

    const winningAmount = auction.currentBid;

    const auctionOrder = new AuctionOrder({
      userId: winnerId,
      auctionId: id,
      amount: auction.highestBid,
      customerEmail,
      customerName,
      status: "pending",
      paymentType: "Auction"
    });

    await auctionOrder.save({ session });

    const paymentDetails = await createAuctionPaymentIntent(auctionOrder);

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      auctionOrder: {
        auctionOrderId: auctionOrder._id,
        amount: auction.highestBid,
        status: auctionOrder.status,
        clientSecret: paymentDetails.clientSecret,
        currency: paymentDetails.currency,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

