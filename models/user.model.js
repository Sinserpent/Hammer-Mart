import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["buyer", "seller"],
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    profileImage: { 
      type: String 
    },
    introduction:{ type: String },


    // Buyer fields
    email: {
      type: String,
      unique: true, // ensures uniqueness
      sparse: true, // allows multiple docs with null/undefined
      lowercase: true,
      trim: true,
    },

    // Seller fields
    businessName: {
      type: String,
      trim: true,
    },
    businessEmail: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    businessContact: {
      type: String,
      trim: true,
    },
    businessAddress: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },
    verifyOtp: { type: String, default: "" },
    verifyOtpExpiryAt: { type: Number, default: 0 },
    isAccountVerified: { type: Boolean, default: false },
    resetOtp: { type: String, default: "" },
    resetOtpExpiryAt: { type: Number, default: 0 },
    b2bVerified: { 
        type: Boolean, 
        default: false 
    },
    subscriptionLevel: {
        type: String,
        enum: ["essential", "enterprise", "premium"],
        required: function() {
            // The subscriptionLevel is required only if b2bVerified is true
            return this.b2bVerified === true;
        },
    },
  },
  { timestamps: true }
);

const userModel = mongoose.models.User || mongoose.model("User", userSchema);
export default userModel;
