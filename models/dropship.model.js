import mongoose from "mongoose";

const skuSchema = new mongoose.Schema({
  sku_id: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  original_price: { type: Number, min: 0, default: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 }
});

const productSchema = new mongoose.Schema({
  product_id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  price: { type: Number, min: 0, default: 0 },
  original_price: { type: Number, min: 0, default: 0 },
  currency: { type: String, default: "USD", enum: ["USD", "EUR", "PKR", "GBP", "CNY"] },
  stock: { type: Number, min: 0, default: 0 },
  images: { type: [String], default: [] },
  videos: { type: [String], default: [] },
  category_id: { type: Number, default: 0 },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviews_count: { type: Number, default: 0 },
  sales_count: { type: Number, default: 0 },
  sku_variants: { type: [skuSchema], default: [] },
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
  }
}, { timestamps: true });

export default mongoose.model("ProductDS", productSchema);