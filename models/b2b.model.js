import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  message: { type: String, required: true }
}, { timestamps: true });

const B2BProductModel = new mongoose.Schema({
  productName: { type: String, required: true },
  supplierName: { type: String, required: true },
  description: { type: String, required: true },
  images: { type: [String], default: [] },
  video: { type: String },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "sellerModel",
    required: true
  },
  sellerModel: {
    type: String,
    required: true,
    enum: ["User", "Admin"]
  },
  type: {
    type: String,
    enum: ["b2b"],
    default: "b2b"
  },
  reviews: { type: [reviewSchema], default: [] }
}, { timestamps: true });

const b2bProduct =
  mongoose.models.b2bProduct || mongoose.model("ProductB2B", B2BProductModel);

export default b2bProduct;
