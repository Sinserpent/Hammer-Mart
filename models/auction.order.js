import mongoose from "mongoose";

const auctionOrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User" // Only users can bid/buy
  },
  auctionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Auction"
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "paid", "failed", "canceled"],
    default: "pending"
  },
  paymentType: { type:String, required:true, enum:["Auction","Order","B2B"] },
  customerEmail: { type: String, required: true },
  customerName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const AuctionOrder =
  mongoose.models.AuctionOrder ||
  mongoose.model("AuctionOrder", auctionOrderSchema);

export default AuctionOrder;
