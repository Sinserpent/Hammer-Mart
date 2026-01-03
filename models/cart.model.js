import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true, // Always required for all types
  },
  sku: {
    type: String,
    required: function () {
      return this.type === "inventory"; // Only required for inventory
    },
  },
  type: {
    type: String,
    enum: ["inventory", "dropship", "b2b"],
    required: true,
  },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  customFields: { type: mongoose.Schema.Types.Mixed }, // Add this for dropship
  itemVariant: { type: Number, default: 0 } // Add this for b2b or other types if needed
});

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: { type: [cartItemSchema], default: [] },
    totalPrice: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 🔹 Helper to recalc total
cartSchema.methods.recalcTotal = function () {
  this.totalPrice = this.items.reduce((sum, item) => sum + item.total, 0);
};

// 🔹 Auto-update before save
cartSchema.pre("save", function (next) {
  this.recalcTotal();
  next();
});

const Cart = mongoose.models.Cart || mongoose.model("Cart", cartSchema);
export default Cart;
