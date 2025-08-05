import Product from '../models/product.js';

export const createProductController = async (req, res, next) => {
  try {
    const existing = await Product.findOne({ name: req.body.name });

    if (existing) {
      return res.status(409).json({ error: 'Product already exists' });
    }

    const product = new Product(req.body);
    await product.save();
    res.status(201).json({ message: 'Product created', product });

  } catch (err) {
    next(err);
  }
};
