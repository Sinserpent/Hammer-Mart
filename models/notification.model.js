import mongoose from "mongoose";

const emailTemplateSchema = new mongoose.Schema({
  template_key: {
    type: String,
    required: true,
    unique: true,
    // Examples: "order_placed_admin", "order_placed_customer", "auction_bid_notification", etc.
  },
  subject: {
    type: String,
    required: true
  },
  html_body: {
    type: String,
    required: true
  },
  text_body: {
    type: String,
    required: true
  },
  variables: [{
    name: String,
    description: String,
    required: Boolean
  }],
  role: {
    type: String,
    enum: ['admin', 'customer', 'seller', 'dropshipper', 'b2b', 'bidder'],
    required: true
  },
  event_type: {
    type: String,
    enum: ['order_placed', 'payment_received', 'auction_bid', 'auction_won', 'delivery_update', 'b2b_quote', 'system_error'],
    required: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const notificationLogSchema = new mongoose.Schema({
  recipient_email: {
    type: String,
    required: true
  },
  recipient_role: {
    type: String,
    enum: ['admin', 'customer', 'seller', 'dropshipper', 'b2b', 'bidder'],
    required: true
  },
  event_type: {
    type: String,
    enum: ['order_placed', 'payment_received', 'auction_bid', 'auction_won', 'delivery_update', 'b2b_quote', 'system_error'],
    required: true
  },
  subject: String,
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'retry'],
    default: 'pending'
  },
  attempts: {
    type: Number,
    default: 0
  },
  error_message: String,
  template_used: String,
  data_payload: mongoose.Schema.Types.Mixed,
  sent_at: Date,
  order_id: String,
  auction_id: String
}, { timestamps: true });

export const EmailTemplate = mongoose.model("EmailTemplate", emailTemplateSchema);
export const NotificationLog = mongoose.model("NotificationLog", notificationLogSchema);