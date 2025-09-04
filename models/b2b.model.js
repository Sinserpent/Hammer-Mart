import mongoose from "mongoose";

const b2bProductSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String, required: true },

  basePrice: { type: Number, required: true, min: 0 },
  minOrderQty: { type: Number, required: true, min: 1 },
  bulkUnit: { 
    type: String, 
    enum: ["piece", "box", "carton", "pallet"], 
    default: "box" 
  },

  discount: { type: Number, default: 0, min: 0 },
  quantity: {
    available: { type: Number, default: 0, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
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

  images: { type: [String], default: [] },

  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },

  tradeTerms: { type: String },

  status: { 
    type: String, 
    enum: ["active", "inactive", "out-of-stock"], 
    default: "active" 
  }
}, { timestamps: true });

export default mongoose.model("B2BProduct", b2bProductSchema);
