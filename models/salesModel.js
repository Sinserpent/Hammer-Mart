import mongoose from 'mongoose';
import AutoIncrementFactory from 'mongoose-sequence';

const AutoIncrement = AutoIncrementFactory(mongoose.connection);

const saleItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  rate: { type: Number, required: true, min: 0 },
}, { _id: false });

const saleSchema = new mongoose.Schema({
  invoiceNumber: { type: Number, unique: true },
  counter: { type: String, trim: true },
  status: { type: String, enum: ['Confirm'], default: 'Confirm', trim: true },
  saleType: { type: String, enum: ['On Cash'], default: 'On Cash', trim: true },
  saleDate: { type: Date, default: Date.now },
  customerType: { type: String, enum: ['Walking Customer'], default: 'Walking Customer', trim: true },
  transportation: { type: String, trim: true },
  saleMethod: { type: String, enum: ['Wholesale'], default: 'Wholesale', trim: true },
  quantity: { type: Number, default: 0, min: 0 },
  items: [saleItemSchema],
}, { timestamps: true });

saleSchema.plugin(AutoIncrement, { inc_field: 'invoiceNumber', start_seq: 1 });

const Sale = mongoose.model('Sale', saleSchema);
export default Sale;
