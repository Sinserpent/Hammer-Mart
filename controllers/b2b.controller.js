import B2BProduct from "../models/b2b.model.js";

export const createB2BProductController = async (req, res, next) => {
  try {
    const { sku } = req.body;

    // Ensure SKU uniqueness within B2B catalog
    const existing = await B2BProduct.findOne({ sku });
    if (existing) {
      return res.status(409).json({ error: "B2B Product with this SKU already exists" });
    }

    const b2bProduct = new B2BProduct(req.body);
    await b2bProduct.save();

    res.status(201).json({ message: "B2B Product created", product: b2bProduct });
  } catch (err) {
    next(err);
  }
};
