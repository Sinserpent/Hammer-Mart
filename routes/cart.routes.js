
import express from "express";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import ProductDS from "../models/dropship.model.js";
import auth from "../middleware/auth.js";

const router = express.Router();


// --- Helper: format cart response for inventory items ---
const formatInventoryCartResponse = (cart) => ({
  _id: cart._id,
  userId: cart.userId,
  items: cart.items.map((item) => {
    const productData = item.productId
      ? {
          _id: item.productId._id,
          name: item.productId.name,
          brand: item.productId.brand,
          category: item.productId.category,
          images: item.productId.images || [],
          sku_variants: item.productId.sku_variants || [],
        }
      : {};

    return {
      productId: item.productId?._id || null,
      sku: item.sku,
      type: item.type,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
      product: productData,
    };
  }),
  totalPrice: cart.totalPrice,
  createdAt: cart.createdAt,
  updatedAt: cart.updatedAt,
});

// --- Helper: format cart response for dropship items ---
const formatDropshipCartResponse = (cart) => ({
  _id: cart._id,
  userId: cart.userId,
  items: cart.items.map((item) => ({
    productId: item.product?._id || null,
    type: item.type,
    quantity: item.quantity,
    price: item.price,
    total: item.total,
    customFields: item.customFields || {},
    product: {
      _id: item.product?._id || null,
      title: `${item.productId?.title || "Dropship Item"}`,
      brand: "N/A",
      category: "N/A",
      images: [],
      sku_variants: [],
    },
  })),
  totalPrice: cart.totalPrice,
  createdAt: cart.createdAt,
  updatedAt: cart.updatedAt,
});

router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
      await cart.save();
    }
    
    // We need to handle population differently since both functions target the same path
    // but with different models. We'll populate based on item type.
    
    // First, let's reload the cart with conditional population
    cart = await Cart.findOne({ userId });
    
    // Manually populate each item based on its type
    for (let item of cart.items) {
      if (item.type === "inventory" && item.productId) {
        await cart.populate({
          path: `items.${cart.items.indexOf(item)}.productId`,
          model: "Product"
        });
      } else if (item.type === "dropship" && item.productId) {
        await cart.populate({
          path: `items.${cart.items.indexOf(item)}.productId`,
          model: "ProductDS"
        });
      }
    }
    
    // Format response with mixed item types
    const formattedCart = {
      _id: cart._id,
      userId: cart.userId,
      items: cart.items.map((item) => {
        let productData = {};
        
        if (item.type === "dropship") {
          productData = {
            _id: item.productId || null,
            title: item.productId.title || "N/A", // Fixed this - was referencing item instead of item.title
            brand: "",
            category: "",
            images: item.productId.images || [],
            sku_variants: [],
          };
        } else if (item.productId) {
          productData = {
            _id: item.productId._id,
            name: item.productId.name,
            brand: item.productId.brand,
            category: item.productId.category,
            images: item.productId.images || [],
            sku_variants: item.productId.sku_variants || [],
          };
        } else {
          productData = {};
        }

        const baseItem = {
          productId: item.productId?._id || null,
          type: item.type,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          product: productData,
        };

        if (item.type === "inventory") {
          baseItem.sku = item.sku;
        } else if (item.type === "dropship") {
          baseItem.customFields = item.customFields || {};
        }

        return baseItem;
      }),
      totalPrice: cart.totalPrice,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };

    res.status(200).json(formattedCart);
  } catch (err) {
    console.error("Get cart error:", err);
    res.status(500).json({ error: err.message });
  }
});


//router.post("/add", auth, async (req, res) => {
//  try {
//    const { productId, sku, quantity = 1 } = req.body;
//    const userId = req.user.id;

//    if (!productId || !sku) {
//      return res
//        .status(400)
//        .json({ message: "ProductId and SKU are required" });
//    }
//    if (quantity < 1) {
//      return res.status(400).json({ message: "Quantity must be at least 1" });
//    }

//    let cart = await Cart.findOne({ userId });
//    if (!cart) cart = new Cart({ userId, items: [] });

//    // Fetch latest price for inventory item
//    const product = await Product.findById(productId);
//    if (!product)
//      return res.status(404).json({ message: "Inventory product not found" });

//    const variant = product.sku_variants.find((v) => v.sku === sku);
//    if (!variant) return res.status(404).json({ message: "SKU not found" });

//    const variantQuantity = variant.quantity?.available || 0;
//    if (variantQuantity < quantity)
//      return res
//        .status(400)
//        .json({ message: "Insufficient stock for the requested SKU" });
//    const price = Math.max(0, variant.price - (variant.discount || 0));

//    // Find existing inventory item
//    const existingIndex = cart.items.findIndex(
//      (item) =>
//        item.productId?.toString() === productId &&
//        item.type === "inventory" &&
//        item.sku === sku
//    );

//    if (existingIndex !== -1) {
//      const existingItem = cart.items[existingIndex];
//      existingItem.quantity += quantity;
//      existingItem.price = price;
//      existingItem.total = existingItem.quantity * existingItem.price;
//    } else {
//      const newItem = {
//        productId,
//        type: "inventory",
//        sku,
//        quantity,
//        price,
//        total: price * quantity,
//      };
//      cart.items.push(newItem);
//    }

//    await cart.save();
//    res.status(200).json(formatInventoryCartResponse(cart));
//  } catch (err) {
//    console.error("Add inventory to cart error:", err);
//    res.status(500).json({ error: err.message });
//  }
//});

router.post("/add", auth, async (req, res) => {
  try {
    const { productId, sku, quantity = 1 } = req.body;
    const userId = req.user.id;

    if (!productId || !sku) {
      return res.status(400).json({ message: "ProductId and SKU are required" });
    }
    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [] });

    // Fetch latest price + stock
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Inventory product not found" });

    const variant = product.sku_variants.find((v) => v.sku === sku);
    if (!variant) return res.status(404).json({ message: "SKU not found" });

    const available = variant.quantity?.available || 0;

    // Check against *cart existing quantity* + new quantity
    const existingItem = cart.items.find(
      (item) =>
        item.productId?.toString() === productId &&
        item.type === "inventory" &&
        item.sku === sku
    );

    const totalRequested = (existingItem?.quantity || 0) + quantity;
    if (totalRequested > available) {
      return res
        .status(400)
        .json({ message: `Only ${available} units available for this SKU` });
    }

    const price = Math.max(0, variant.price - (variant.discount || 0));

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.price = price;
      existingItem.total = existingItem.quantity * existingItem.price;
    } else {
      cart.items.push({
        productId,
        type: "inventory",
        sku,
        quantity,
        price,
        total: price * quantity,
      });
    }

    await cart.save();
    res.status(200).json(formatInventoryCartResponse(cart));
  } catch (err) {
    console.error("Add inventory to cart error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- UPDATE INVENTORY ITEM ---
router.put("/update", auth, async (req, res) => {
  try {
    const { productId, sku, quantity } = req.body;
    const userId = req.user.id;

    if (!productId || !sku || quantity === undefined) {
      return res
        .status(400)
        .json({ message: "ProductId, SKU, and quantity are required" });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.productId?.toString() === productId &&
        item.type === "inventory" &&
        item.sku === sku
    );
    if (itemIndex === -1)
      return res.status(404).json({ message: "Item not found in cart" });

    // Refresh price
    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ message: "Inventory product not found" });

    const variant = product.sku_variants.find((v) => v.sku === sku);
    if (!variant) return res.status(404).json({ message: "SKU not found" });

    const price = Math.max(0, variant.price - (variant.discount || 0));

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      const item = cart.items[itemIndex];
      item.quantity = quantity;
      item.price = price;
      item.total = item.quantity * item.price;
    }

    await cart.save();
    //await populateCart(cart);
    res.status(200).json(formatInventoryCartResponse(cart));
  } catch (err) {
    console.error("Update inventory cart error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- REMOVE INVENTORY ITEM ---
router.delete("/remove", auth, async (req, res) => {
  try {
    const { productId, sku } = req.body;
    const userId = req.user.id;

    if (!productId || !sku) {
      return res
        .status(400)
        .json({ message: "ProductId and SKU are required" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const originalLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) =>
        !(
          item.productId?.toString() === productId &&
          item.type === "inventory" &&
          item.sku === sku
        )
    );

    if (cart.items.length === originalLength) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    await cart.save();
    //await populateCart(cart);
    res.status(200).json(formatInventoryCartResponse(cart));
  } catch (err) {
    console.error("Remove inventory from cart error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ========== DROPSHIP ROUTES ==========

// --- ADD DROPSHIP ITEM ---

//router.post("/addDS", auth, async (req, res) => {
//  try {
//    const { productId, quantity = 1, customFields = {} } = req.body;
//    const userId = req.user.id;

//    if (!productId) return res.status(400).json({ message: "ProductId is required" });
//    if (quantity < 1) return res.status(400).json({ message: "Quantity must be at least 1" });

//    let cart = await Cart.findOne({ userId });
//    if (!cart) cart = new Cart({ userId, items: [] });

//    const product = await ProductDS.findById(productId);
//    if (!product) return res.status(404).json({ message: "Dropship product not found" });

//    const price = product.price;

//    // Compare both productId and customFields to distinguish variants
//    const existingIndex = cart.items.findIndex((item) => {
//      return (
//        item.productId?.toString() === productId &&
//        item.type === "dropship" &&
//        JSON.stringify(item.customFields || {}) === JSON.stringify(customFields)
//      );
//    });

//    if (existingIndex !== -1) {
//      const existingItem = cart.items[existingIndex];
//      existingItem.quantity += quantity;
//      existingItem.price = price;
//      existingItem.total = existingItem.quantity * existingItem.price;
//    } else {
//      cart.items.push({
//        productId,
//        type: "dropship",
//        sku: null,
//        quantity,
//        price,
//        total: price * quantity,
//        customFields
//      });
//    }

//    await cart.save();
//    res.status(200).json(formatDropshipCartResponse(cart));
//  } catch (err) {
//    console.error("Add dropship to cart error:", err);
//    res.status(500).json({ error: err.message });
//  }
//});

router.post("/addDS", auth, async (req, res) => {
  try {
    const { productId, quantity = 1, customFields = {} } = req.body;
    const userId = req.user.id;

    if (!productId) return res.status(400).json({ message: "ProductId is required" });
    if (quantity < 1) return res.status(400).json({ message: "Quantity must be at least 1" });

    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [] });

    const product = await ProductDS.findById(productId);
    if (!product) return res.status(404).json({ message: "Dropship product not found" });

    const price = product.price;

    // Find existing item with EXACT same productId, type, AND customFields
    const existingIndex = cart.items.findIndex((item) => {
      return (
        item.productId?.toString() === productId &&
        item.type === "dropship" &&
        JSON.stringify(item.customFields || {}) === JSON.stringify(customFields)
      );
    });

    if (existingIndex !== -1) {
      // EXACT variant already exists (same customFields), just update quantity
      const existingItem = cart.items[existingIndex];
      existingItem.quantity += quantity;
      existingItem.price = price;
      existingItem.total = existingItem.quantity * existingItem.price;
      // Keep the existing itemVariant - DON'T change it
    } else {
      // New variant (different customFields) - calculate next itemVariant number
      const existingVariantsForProduct = cart.items.filter(
        (item) => item.productId?.toString() === productId && item.type === "dropship"
      );
      
      // Find the highest itemVariant number for this productId
      const maxVariant = existingVariantsForProduct.length > 0
        ? Math.max(...existingVariantsForProduct.map(v => v.itemVariant || 0))
        : 0;
      
      const nextVariant = maxVariant + 1;

      cart.items.push({
        productId,
        type: "dropship",
        sku: null,
        quantity,
        price,
        total: price * quantity,
        customFields,
        itemVariant: nextVariant  // Assign new unique variant number
      });
    }

    await cart.save();
    res.status(200).json(formatDropshipCartResponse(cart));
  } catch (err) {
    console.error("Add dropship to cart error:", err);
    res.status(500).json({ error: err.message });
  }
});


// --- UPDATE DROPSHIP ITEM ---
router.put("/updateDS", auth, async (req, res) => {
  try {
    const { productId, quantity, customFields } = req.body;
    const userId = req.user.id;

    if (!productId || quantity === undefined) {
      return res
        .status(400)
        .json({ message: "ProductId and quantity are required" });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.productId?.toString() === productId && item.type === "dropship"
    );
    if (itemIndex === -1)
      return res.status(404).json({ message: "Item not found in cart" });

    // Refresh price
    const product = await ProductDS.findById(productId);
    if (!product)
      return res.status(404).json({ message: "Dropship product not found" });

    const price = product.price;

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      const item = cart.items[itemIndex];
      item.quantity = quantity;
      item.price = price;
      item.total = item.quantity * item.price;
      if (customFields) {
        item.customFields = { ...item.customFields, ...customFields };
      }
    }

    await cart.save();
    //await populateCart(cart);
    res.status(200).json(formatDropshipCartResponse(cart));
  } catch (err) {
    console.error("Update dropship cart error:", err);
    res.status(500).json({ error: err.message });
  }
});


//router.put("/updateDS", auth, async (req, res) => {
//  try {
//    const { productId, itemVariant, quantity, customFields } = req.body;
//    const userId = req.user.id;

//    console.log("=== UPDATE DS REQUEST ===");
//    console.log("User ID:", userId);
//    console.log("Product ID:", productId);
//    console.log("Item Variant:", itemVariant);
//    console.log("Quantity:", quantity);
//    console.log("Custom Fields:", customFields);

//    if (!productId || !itemVariant || quantity === undefined) {
//      console.log("❌ Validation failed - missing required fields");
//      return res
//        .status(400)
//        .json({ message: "ProductId, itemVariant, and quantity are required" });
//    }

//    let cart = await Cart.findOne({ userId });
//    if (!cart) {
//      console.log("❌ Cart not found for user:", userId);
//      return res.status(404).json({ message: "Cart not found" });
//    }

//    console.log("✓ Cart found, total items:", cart.items.length);

//    // Find the specific variant using both productId AND itemVariant
//    const itemIndex = cart.items.findIndex(
//      (item) =>
//        item.productId?.toString() === productId && 
//        item.type === "dropship" &&
//        item.itemVariant === itemVariant
//    );
    
//    if (itemIndex === -1) {
//      console.log("❌ Variant not found in cart");
//      console.log("Available variants for this product:");
//      cart.items
//        .filter(item => item.productId?.toString() === productId)
//        .forEach(item => {
//          console.log(`  - Variant ${item.itemVariant}:`, item.customFields);
//        });
//      return res.status(404).json({ message: "Variant not found in cart" });
//    }

//    console.log("✓ Variant found at index:", itemIndex);
//    console.log("Current item state:", cart.items[itemIndex]);

//    // Refresh price from database
//    const product = await ProductDS.findById(productId);
//    if (!product) {
//      console.log("❌ Dropship product not found in database");
//      return res.status(404).json({ message: "Dropship product not found" });
//    }

//    console.log("✓ Product found, current price:", product.price);
//    const price = product.price;

//    if (quantity <= 0) {
//      console.log("⚠️  Quantity <= 0, removing variant from cart");
//      cart.items.splice(itemIndex, 1);
//      console.log("✓ Variant removed, remaining items:", cart.items.length);
//    } else {
//      // Update the specific variant
//      const item = cart.items[itemIndex];
//      const oldQuantity = item.quantity;
//      const oldTotal = item.total;

//      item.quantity = quantity;
//      item.price = price;
//      item.total = item.quantity * item.price;
      
//      console.log("Updating variant:");
//      console.log(`  Quantity: ${oldQuantity} → ${item.quantity}`);
//      console.log(`  Price: ${item.price}`);
//      console.log(`  Total: ${oldTotal} → ${item.total}`);

//      if (customFields) {
//        const oldCustomFields = { ...item.customFields };
//        item.customFields = { ...item.customFields, ...customFields };
//        console.log("Custom fields updated:");
//        console.log("  Old:", oldCustomFields);
//        console.log("  New:", item.customFields);
//      }
//    }

//    await cart.save();
//    console.log("✓ Cart saved successfully");
//    console.log("=== UPDATE DS COMPLETE ===\n");

//    res.status(200).json(formatDropshipCartResponse(cart));
//  } catch (err) {
//    console.error("❌ Update dropship cart error:", err);
//    console.error("Stack trace:", err.stack);
//    res.status(500).json({ error: err.message });
//  }
//});

//router.put("/updateDS", auth, async (req, res) => {
//  try {
//    const { productId, itemVariant, quantity } = req.body;
//    const userId = req.user.id;

//    if (!productId || itemVariant === undefined || quantity === undefined) {
//      return res
//        .status(400)
//        .json({ message: "ProductId, itemVariant, and quantity are required" });
//    }

//    let cart = await Cart.findOne({ userId });
//    if (!cart) return res.status(404).json({ message: "Cart not found" });

//    // Match item strictly by productId + itemVariant
//    const itemIndex = cart.items.findIndex(
//      (item) =>
//        item.productId?.toString() === productId &&
//        item.type === "dropship" &&
//        item.itemVariant === itemVariant
//    );

//    const product = await ProductDS.findById(productId);
//    if (!product)
//      return res.status(404).json({ message: "Dropship product not found" });

//    const price = product.price;

//    if (itemIndex === -1) {
//      // Item not in cart yet
//      if (quantity > 0) {
//        cart.items.push({
//          productId,
//          type: "dropship",
//          sku: null,
//          quantity,
//          price,
//          total: price * quantity,
//          itemVariant,
//        });
//      } else {
//        return res.status(404).json({ message: "Variant not found to remove" });
//      }
//    } else {
//      // Item exists → update or remove
//      if (quantity <= 0) {
//        cart.items.splice(itemIndex, 1); // remove
//      } else {
//        const item = cart.items[itemIndex];
//        item.quantity = quantity;
//        item.price = price;
//        item.total = quantity * price;
//      }
//    }

//    await cart.save();
//    res.status(200).json(formatDropshipCartResponse(cart));
//  } catch (err) {
//    console.error("Update dropship cart error:", err);
//    res.status(500).json({ error: err.message });
//  }
//});


// --- REMOVE DROPSHIP ITEM ---
router.delete("/removeDS", auth, async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    if (!productId) {
      return res.status(400).json({ message: "ProductId is required" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const originalLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) =>
        !(item.productId?.toString() === productId && item.type === "dropship")
    );

    if (cart.items.length === originalLength) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    await cart.save();
    //await populateCart(cart);
    res.status(200).json(formatDropshipCartResponse(cart));
  } catch (err) {
    console.error("Remove dropship from cart error:", err);
    res.status(500).json({ error: err.message });
  }
});

//import isEqual from "lodash.isequal";

//router.delete("/removeDS", auth, async (req, res) => {
//  try {
//    const { productId, itemVariant } = req.body; // Changed from itemvariant
//    const userId = req.user.id;

//    if (!productId)
//      return res.status(400).json({ message: "ProductId is required" });
    
//    if (!itemVariant)
//      return res.status(400).json({ message: "itemVariant is required" });

//    const cart = await Cart.findOne({ userId });
//    if (!cart) return res.status(404).json({ message: "Cart not found" });

//    const originalLength = cart.items.length;

//    cart.items = cart.items.filter(
//      (item) =>
//        !(
//          item.productId?.toString() === productId &&
//          item.type === "dropship" &&
//          item.itemVariant === itemVariant // Changed to match schema
//        )
//    );

//    if (cart.items.length === originalLength)
//      return res.status(404).json({ message: "Variant not found in cart" });

//    await cart.save();
//    res.status(200).json(formatDropshipCartResponse(cart));
//  } catch (err) {
//    console.error("Remove dropship from cart error:", err);
//    res.status(500).json({ error: err.message });
//  }
//});




// --- Clear cart ---
router.delete("/clear", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = [];
    await cart.save();
    res.status(200).json({
      _id: cart._id,
      userId: cart.userId,
      items: [],
      totalPrice: cart.totalPrice,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    });
  } catch (err) {
    console.error("Clear cart error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
