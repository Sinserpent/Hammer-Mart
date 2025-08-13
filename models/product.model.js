import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  quantity: {
    available: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
  },
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
  image: { type: String }, // Cloudinary URL
  sellerName: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive', 'out-of-stock'], default: 'active' }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);

