import mongoose from "mongoose";

const productAttributesSchema = new mongoose.Schema(
  {
    product_id: {
      type: Number,
      required: true,
      index: true,
      unique: true,
    },
    attributes: {
      type: Map,
      of: {
        type: [String],
        validate: {
          validator: arr => Array.isArray(arr) && arr.every(v => typeof v === "string"),
          message: "Each attribute value must be an array of strings",
        },
      },
      default: {},
    },
  },
  { timestamps: true }
);

const ProductAttributes = mongoose.model("ProductAttributes", productAttributesSchema);

export default ProductAttributes;
