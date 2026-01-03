// models/payment.model.js
import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema(
  {
    paymentType: { type:String, required:true, enum:["Auction","Order","B2B"] },
    paymentIntentId: { type: String, required: true, unique: true }, // Stripe PaymentIntent ID
    amount: { type: Number, required: true }, // in cents
    currency: { type: String, required: true, default: 'usd' },
    status: { type: String, required: true }, // succeeded, requires_payment_method, etc.
    description: { type: String },
    paymentMethodId: { type: String },
    receiptEmail: { type: String },
    customerId: { type: String }, // optional Stripe customer ID
    refundedAmount: { type: Number, default: 0 }, // cumulative refunded amount in cents
    charges: [
      {
        chargeId: String,
        amount: Number,
        status: String,
        created: Number,
      },
    ],
    refunds: [
      {
        refundId: String,
        amount: Number,
        reason: String,
        status: String,
        created: Number,
      },
    ],
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model('Payment', PaymentSchema);
