import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  message: { type: String, required: true }
}, { timestamps: true });

const skuVariantSchema = new mongoose.Schema({
  sku: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  quantity: {
    available: { type: Number, default: 0, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
  },
  color: String,
  size: String,
  otherSpecs: mongoose.Schema.Types.Mixed,
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, required: true },
    category: { type: String, required: true },
    description: {
      teaser: String,
      longDescription: String,
      keyFeatures: [String],
      usageInstructions: String,
      packageContents: [String],
    },
    images: { type: [String], default: [] },
    seller: { type: String, required: true },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "sellerModel",
      required: true,
    },
    sellerModel: {
      type: String,
      required: true,
      enum: ["User", "Admin"],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "out-of-stock"],
      default: "active",
    },
    sku_variants: { type: [skuVariantSchema], default: [] },
    type: {
      type: String,
      enum: ["inventory"],
      default: "inventory"
    },
    reviews: { type: [reviewSchema], default: [] }
  },
  { timestamps: true }
);

function recalcStatus(product) {
  if (
    product.sku_variants.length &&
    product.sku_variants.every((v) => v.quantity.available === 0)
  ) {
    product.status = "out-of-stock";
  } else if (product.status === "out-of-stock") {
    product.status = "active";
  }
}

productSchema.pre("save", function (next) {
  recalcStatus(this);
  next();
});

productSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (update.sku_variants || update["$set.sku_variants"]) {
    const doc = await this.model.findOne(this.getQuery());
    if (doc) {
      recalcStatus(doc);
      this.setUpdate({ ...update, status: doc.status });
    }
  }
  next();
});

productSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
