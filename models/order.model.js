import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  // Product references
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "productModel", // dynamically point to Product or ProductDS
  },
  productModel: {
    type: String,
    required: true,
    enum: ["Product", "ProductDS"],
  },

  // Core sale details
  name: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },

  // Seller info
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "sellerModel", // dynamic ref (User or Admin)
  },
  sellerModel: {
    type: String,
    enum: ["User", "Admin"],
    required: true,
  },
  sellerEmail: {
    type: String,
    required: true,
  },
  sellerName: {
    type: String,
    required: true,
  },
  customFields: { type: mongoose.Schema.Types.Mixed, default: null },
  // Type of product
  productType: {
    type: String,
    enum: ["dropship", "inventory"],
    required: true,
  },
  product_id: { type:String },
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel' // <-- dynamic reference
  },
  userModel: {
    type: String,
    required: true,
    enum: ['User', 'Admin'] // can be either
  },
  items: [saleItemSchema],
  totalSalePrice: { type: Number, required: true },
  customerEmail: { type: String },
  address: { type: String },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'canceled'],
    default: 'pending'
  },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
