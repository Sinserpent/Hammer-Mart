import mongoose from "mongoose";

const auctionWin = new mongoose.Schema({
  auctionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
  auctionWinner : { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
  amount: { type: Number, required: true }, 
},{ timestamps:true })

const bidSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  auctionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
  bidderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

const auctionSchema = new mongoose.Schema({
  title: { type: String, required: true },                 // matches frontend "title"
  description: { type: String, required: true },           // matches frontend "description"
  startingPrice: { type: Number, required: true },         // matches frontend "startingPrice"
  highestBid: { type: Number, default: 0 },                // matches frontend "highestBid"
  category: { type: String, required: true },              // matches frontend "category"
  startTime: { type: Date, required: true },               // matches frontend "startTime"
  endTime: { type: Date, required: true },                 // matches frontend "endTime"
  minBidIncrement: { type: Number, default: 0 },           // matches frontend "minBidIncrement"

  images: { type: [String], default: [] },                 // uploaded Cloudinary URLs
  video: { type: String },                                 // optional video Cloudinary URL

  extraFields: {
    type: Map,
    of: String
  },

  /*
  // --- Alternative style: Array of key/value pairs ---
  // extraFields: [{
  //   key: { type: String, required: true },
  //   value: { type: String, required: true }
  // }],
  */      // JSON key/value array parsed and stored

  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Auction mechanics
  status: { type: String, enum: ['active', 'scheduled', 'ended'], default: 'scheduled' },
  highestBidId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid' },
  topBids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bid' }]
}, { timestamps: true });

export const Bid = mongoose.model('Bid', bidSchema);
export const Auction = mongoose.model('Auction', auctionSchema);
export const AuctionWin = mongoose.model('AuctionWin', auctionWin);
