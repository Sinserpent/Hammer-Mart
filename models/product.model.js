import mongoose from "mongoose";

const skuVariantSchema = new mongoose.Schema({
  sku: { type: String, required: true }, 
  price: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  quantity: {
    available: { type: Number, default: 0, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
  },
  color: String,
  size: String,
  otherSpecs: mongoose.Schema.Types.Mixed
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  description: {
    teaser: String,
    longDescription: String,
    keyFeatures: [String],
    usageInstructions: String,
    packageContents: [String]
  },
  images: { type: [String], default: [] },
  sellerName: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive', 'out-of-stock'], default: 'active' },
  sku_variants: { type: [skuVariantSchema], default: [] } // variants array
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
