import Product from "../models/product.model.js";

export const createProductController = async (req, res, next) => {
  console.log('Request Body:', req.body);

  try {
    const { name, brand, category, sku_variants } = req.body;

    if (!sku_variants || !Array.isArray(sku_variants) || sku_variants.length === 0) {
      return res.status(400).json({ error: "At least one SKU variant is required" });
    }

    // Check for duplicate SKUs within the same product request
    const skuSet = new Set(sku_variants.map(v => v.sku));
    if (skuSet.size !== sku_variants.length) {
      return res.status(400).json({ error: "Duplicate SKUs in request" });
    }

    // Check for existing SKUs in the database
    const existingSkus = await Product.findOne({ "sku_variants.sku": { $in: [...skuSet] } });
    if (existingSkus) {
      return res.status(409).json({ error: "One or more SKUs already exist in another product" });
    }

    const product = new Product(req.body);
    await product.save();

    res.status(201).json({ message: "Product created successfully", product });
  } catch (err) {
    next(err);
  }
};
