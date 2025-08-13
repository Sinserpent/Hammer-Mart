import mongoose from "mongoose";

const bidSchema = new mongoose.Schema({
  auctionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
  bidderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

const auctionSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true }, // starting price
  description: {
    teaser: String,
    longDescription: String,
    keyFeatures: [String],
    technicalSpecs: {
      material: String,
      colorVariants: [String],
      otherSpecs: mongoose.Schema.Types.Mixed
    },
    usageInstructions: String,
    packageContents: [String]
  },
  image: { type: String }, // multiple CDN URLs
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'scheduled', 'ended'], default: 'scheduled' },

  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },

  highestBid: { type: Number, default: 0 },
  highestBidId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid' },
  topBids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bid' }]

}, { timestamps: true });

export const Bid = mongoose.model('Bid', bidSchema);
export const Auction = mongoose.model('Auction', auctionSchema);
