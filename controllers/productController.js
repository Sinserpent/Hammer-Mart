import Product from "../models/productModel.js";

export const createProduct = async (req, res) => {
  try {
    const { HScode } = req.body;

    // Check if product with same HScode exists
    const existing = await Product.findOne({ HScode });
    if (existing) {
      return res.status(409).json({ error: "Product with this HScode already exists." });
    }

    const product = new Product(req.body);
    const savedProduct = await product.save();
    
    res.status(201).json({ message: 'Product created', product: savedProduct });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
