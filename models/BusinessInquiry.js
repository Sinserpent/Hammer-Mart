import mongoose from 'mongoose';

const businessInquirySchema = new mongoose.Schema({
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
  sellerId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const BusinessInquiry = mongoose.model('BusinessInquiry', businessInquirySchema);

export default BusinessInquiry;
