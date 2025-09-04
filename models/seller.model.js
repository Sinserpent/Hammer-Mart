import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { category } from "../constants/categories.js";

const sellerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  businessName: { type: String },
  country: { type: String, required: true },
  city: { type: String, required: true },
  storeCategory: { type: String, enum: Object.values(category) },
  b2bApproved: { type: Boolean, default: false },
  tokenVersion: { type: Number, default: 1 } // <-- Added field
}, { timestamps: true });

sellerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10); // 10 salt rounds
  next();
});

sellerSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("Seller", sellerSchema);
