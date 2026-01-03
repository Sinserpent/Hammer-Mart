import express from "express";
import {
  adminLogin,
  adminLogout,
  adminRegister,
  isAuthenticated,
  resetPassword,
  sendResetPasswordOtp,
} from "../controllers/admin.auth.controller.js";
import adminAuth from "../middleware/admin.auth.js";
import { upload } from "../middleware/multer.config.js";
import { uploadToCloudinaryController } from '../controllers/cloudinary.controller.js';
const adminRouter = express.Router();

// admin Register
adminRouter.post("/register",upload.array("image",1), uploadToCloudinaryController , adminRegister); // ✅
// admin Login
adminRouter.post("/login", adminLogin); // ✅
// admin Logout
adminRouter.post("/logout", adminLogout); // ✅
// admin Authenticated
adminRouter.get("/isAuthenticated", adminAuth, isAuthenticated); // ✅
// Send Reset Password OTP
adminRouter.post("/sendResetPasswordOtp", sendResetPasswordOtp); // ✅
// Reset Password
adminRouter.post("/resetPassword", resetPassword); // ✅

export default adminRouter;
