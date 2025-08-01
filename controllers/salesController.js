import Sale from "../models/salesModel.js";
import Product from "../models/productModel.js";

export const createSale = async (req, res) => {
  try {
    const {
      HScode,
      quantity,
      barcode,
      rate,
      itemName,
      itemLocation,
      ...rest
    } = req.body;

    const parsedQuantity = Number(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({ error: "Quantity must be a positive number" });
    }

    const product = await Product.findOne({ HScode: HScode });
    if (!product) {
      return res.status(404).json({ error: "Product not found with given HS Code" });
    }

    const currentStock = Number(product.stock);
    if (isNaN(currentStock)) {
      return res.status(500).json({ error: "Product stock is invalid (not a number)" });
    }

    if (currentStock < parsedQuantity) {
      return res.status(400).json({ error: "Insufficient stock" });
    }
    console.log(quantity);

    product.stock = currentStock - parsedQuantity;
    product.sold += parsedQuantity;
    await product.save();
  
    const newSale = new Sale({
      HScode,
      quantity: parsedQuantity,
      barcode,
      rate,
      itemName,
      itemLocation,
      ...rest
    });

    const savedSale = await newSale.save();

    res.status(201).json({
      message: "Sale recorded and stock updated",
      sale: savedSale,
      remainingStock: product.stock
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
