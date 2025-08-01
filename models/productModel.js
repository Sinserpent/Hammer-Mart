import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  HScode: { type: String, trim: true, required: true, unique: true },
  productCategory: { type: String, required: true, trim: true },
  brand: { type: String, required: true, trim: true },
  itemName: { type: String, trim: true },
  stock: { type: Number, required: true, min: 0, default: 0 },
  sold: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
export default Product;
