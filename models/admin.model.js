import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    verifyOtp: { type: String, default: "" },
    verifyOtpExpiryAt: { type: Number, default: 0 },
    // isAccountVerified: { type: Boolean, default: false },
    resetOtp: { type: String, default: "" },
    resetOtpExpiryAt: { type: Number, default: 0 },
    profileImage: { 
      type: String 
    },
    introduction:{ type: String },
    role: {
      type: String,
      enum: ["superadmin", "b2badmin", "auctionadmin", "swuadmin", "adadmin",  "dsadmin", "invadmin"],
      required: true,
    },
  },
  { timestamps: true }
); 

const adminModel =
  mongoose.models.Admin || mongoose.model("Admin", adminSchema);
export default adminModel;
