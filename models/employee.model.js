import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    verifyOtp: { type: String, default: "" },
    verifyOtpExpiryAt: { type: Number, default: 0 },
    // isAccountVerified: { type: Boolean, default: false },
    resetOtp: { type: String, default: "" },
    resetOtpExpiryAt: { type: Number, default: 0 },
    stars: { type: Number, default: 0 },
    starPoints: { type: Number, default: 0 },
    role: {
      type: String,
      enum: ["promoter", "advertiser"],
      required: true,
    },
  },
  { timestamps: true }
); 

const employeeModel =
  mongoose.models.Employee || mongoose.model("Employee", employeeSchema);
export default employeeModel;