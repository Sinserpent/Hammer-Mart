import mongoose from "mongoose";

const saleItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  sku: { type: String, required: true },
  amount: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true }
});

const saleSchema = new mongoose.Schema({
  items: { type: [saleItemSchema], required: true },
  totalSalePrice: { type: Number, required: true },
  status: { type: String, enum: ["pending", "completed", "cancelled"], default: "completed" }
}, { timestamps: true });

export default mongoose.model("Sale", saleSchema);
