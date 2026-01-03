import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  message: { type: String, required: true }
}, { timestamps: true });

const skuAttributeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: String, required: true },
  name_id: { type: Number },
  value_id: { type: Number }
}, { _id: false });

const productSchema = new mongoose.Schema({
  product_id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  price: { type: Number, min: 0, default: 0 },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "sellerModel",
    required: true,
  },
  sellerModel: {
    type: String,
    required: true,
    enum: ["User", "Admin"],
  },
  original_price: { type: Number, min: 0, default: 0 },
  currency: { type: String, default: "USD", enum: ["USD", "EUR", "PKR", "GBP", "CNY"] },
  stock: { type: Number, min: 0, default: 0 },
  images: { type: [String], default: [] },
  videos: { type: [String], default: [] },
  category_id: { type: Number, default: 0 },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  sales_count: { type: Number, default: 0 },
  sku_variants: { type: mongoose.Schema.Types.Mixed, default: {} },
  attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
  logistics: {
    delivery_time: { type: Number, default: 0 },
    ship_to_country: { type: String, default: "US" }
  },
  package_info: {
    package_width: { type: Number, default: 0 },
    package_height: { type: Number, default: 0 },
    package_length: { type: Number, default: 0 },
    gross_weight: { type: String, default: "0" },
    package_type: { type: Boolean, default: false },
    product_unit: { type: Number, default: 0 }
  },
  raw_response: { type: mongoose.Schema.Types.Mixed },
  file_reference: { type: String },
  type: {
    type: String,
    enum: ["dropship"],
    default: "dropship"
  },
  reviews: { type: [reviewSchema], default: [] }
}, { timestamps: true });

export default mongoose.model("ProductDS", productSchema);
