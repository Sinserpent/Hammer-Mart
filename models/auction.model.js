import mongoose from "mongoose";



const bidSchema = new mongoose.Schema(
  {
    auctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const auctionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    teaser: { type: String, required: true },
    description: { type: String, required: true },
    startingPrice: { type: Number, required: true },
    highestBid: { type: Number, default: 0 },
    category: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    minBidIncrement: { type: Number, default: 0 },

    images: { type: [String], default: [] },
    video: { type: String },

    extraFields: [
      {
        key: { type: String, required: true },
        value: { type: String, required: true }
      }
    ],

    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerModel: {
      type: String,
      required: true,
      enum: ['Admin']
    },
    status: {
      type: String,
      enum: ["active", "scheduled", "ended"],
      default: "scheduled",
    },
    highestBidId: { type: mongoose.Schema.Types.ObjectId, ref: "Bid" },
    topBids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Bid" }],
    winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' }
  },
  { timestamps: true }
);

export const Bid = mongoose.model("Bid", bidSchema);
export const Auction = mongoose.model("Auction", auctionSchema);
//export const AuctionWin = mongoose.model("AuctionWin", auctionWinSchema);