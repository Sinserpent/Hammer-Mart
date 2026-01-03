import mongoose from 'mongoose';

const auctionInquirySchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// reuse model if already compiled
const AuctionInquiry =
  mongoose.models.AuctionInquiry ||
  mongoose.model('AuctionInquiry', auctionInquirySchema);

export default AuctionInquiry;
