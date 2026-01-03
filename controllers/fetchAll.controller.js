import Dropship from "../models/dropship.model.js";
import Inventory from "../models/product.model.js";

// --- Model map for dynamic lookups ---
const modelMap = {
  dropship: Dropship,
  inventory: Inventory,
};

export const fetchAllItems = async (req, res, next) => {
  try {
    const [inventory, dropship] = await Promise.all([
      Inventory.find({}),
      Dropship.find({}, {
      _id: 1,
      product_id: 1,
      title: 1,
      type: 1,
      price: 1,
      original_price: 1,
      images: { $slice: 1 } // Only the first image
    }).lean()
    ]);

    const combined = [...inventory, ...dropship].reverse();
    res.status(200).json(combined);
  } catch (error) {
    next(error);
  }
};

export const getProductByType = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const Model = modelMap[type];

    if (!Model) {
      return res.status(400).json({ message: "Invalid type" });
    }

    const product = await Model.findById(id);
    if (!product) return res.status(404).json({ message: "Not found" });

    res.json(product);
  } catch (err) {
    next(err);
  }
};
