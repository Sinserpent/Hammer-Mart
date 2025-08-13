import mongoose from "mongoose";
import { category } from "../constants/categories.js";{}

const sellerSchema = new mongoose.Schema({ 
   name:  { type:String }, 
   email: { type: String, unique: true },
   phone: { type: String, unique: true },
   businessName: { type:String },
   country: { type:String },
   city: { type:String },
   storeCategory: { type: String, enum: Object.values(category) }}, { 
   timestamps: true });

export default mongoose.model("Seller", sellerSchema);
