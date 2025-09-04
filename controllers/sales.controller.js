import mongoose from "mongoose";
import ProductDS from "../models/dropship.model.js";
import Sale from "../models/sale.model.js";

export async function createSale(req, res) {
  const { items } = req.body; // [{ productId, sku, amount }]

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "No sale items provided" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let totalSalePrice = 0;
    const saleItems = [];

    for (const item of items) {
      const { productId, sku, amount } = item;

      if (!productId || !sku || !amount || amount < 1) {
        throw new Error("Invalid item details");
      }

      // Fetch product
      const product = await ProductDS.findById(productId).session(session);
      if (!product) throw new Error(`Product ${productId} not found`);

      // Find SKU variant
      const variant = product.sku_variants.find(v => v.sku_id === sku);
      if (!variant) throw new Error(`SKU ${sku} not found for product ${productId}`);

      // Check stock
      if (variant.stock < amount) {
        throw new Error(`Insufficient stock for SKU ${sku}`);
      }

      // Calculate pricing
      const unitPrice = variant.price;
      const totalPrice = unitPrice * amount;
      totalSalePrice += totalPrice;

      // Push to saleItems
      saleItems.push({
        product: product._id,
        sku,
        amount,
        unitPrice,
        totalPrice
      });

      // Update stock
      variant.stock -= amount;
      product.sales_count = (product.sales_count || 0) + amount;
      await product.save({ session });
    }

    // Save Sale document
    const sale = new Sale({
      items: saleItems,
      totalSalePrice
    });
    await sale.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, sale });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to process sale" });
  }
}
