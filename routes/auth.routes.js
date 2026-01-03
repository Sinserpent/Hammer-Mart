import express from "express";
import {
  userRegister,
  userLogin,
  userLogout,
  isAuthenticated,
  verifyAccount,
  sendVerificationOtp,
  resetPassword,
  sendResetPasswordOtp,
} from "../controllers/auth.controller.js";
import { upload } from "../middleware/multer.config.js";
import { uploadToCloudinaryController } from '../controllers/cloudinary.controller.js';
import userAuth from "../middleware/user.auth.js";
import userModel from "../models/user.model.js"; 
import jwt from 'jsonwebtoken'


const authRouter = express.Router();

// User Register
authRouter.post("/register",upload.array("image",1) ,uploadToCloudinaryController ,userRegister); // ✅
// User Login
authRouter.post("/login", userLogin); // ✅
// User Logout
authRouter.post("/logout", userLogout); // ✅
// User Authenticated
authRouter.get("/isAuthenticated", userAuth, isAuthenticated); // ✅
// Send Verification OTP
authRouter.post("/sendVerificationOtp", userAuth, sendVerificationOtp); // ✅
// Verify Account
authRouter.post("/verifyAccount", userAuth, verifyAccount); // ✅
// Send Reset Password OTP
authRouter.post("/sendResetPasswordOtp", sendResetPasswordOtp); // ✅
// Reset Password
authRouter.post("/resetPassword", resetPassword); // ✅


authRouter.get('/me', async (req, res) => {
  try {
    // Get token from cookies
    const token = req.cookies.user_token;
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided. Please login.' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. Please login again.' 
      });
    }

    // Find user
    const user = await userModel.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found. Please login again.' 
      });
    }

    // Return user info
    res.json({
      success: true,
      userId: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isVerified: user.isAccountVerified
    });

  } catch (error) {
    console.error('Auth validation error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. Please login again.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please login again.' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication.' 
    });
  }
});



export default authRouter;
