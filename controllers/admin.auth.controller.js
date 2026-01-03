import adminModel from "../models/admin.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import transporter from "../config/nodemailer.js";

// ---------------- Admin Register ----------------
export const adminRegister = async (req, res) => {
  const { fullName ,email ,password ,role ,secretKey, introduction } = req.body;
  
  const profileImage = req.body.images && req.body.images.length > 0 ? req.body.images[0] : null;
  console.log(fullName, email, password, secretKey, role);
  
  if (!fullName || !email || !password || !role || !secretKey  )
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });

  // Ensure your environment variables are loaded (e.g., using 'dotenv')
  const superadmin = process.env.ADMIN_REGISTRATION_CODE
  const b2badmin = process.env.B2BADMIN_REGISTRATION_CODE
  const auctionadmin = process.env.AUCTIONADMIN_REGISTRATION_CODE
  const swuadmin = process.env.SALEWITHUSADMIN_REGISTRATION_CODE

  const validCombinations = {
    'superadmin': superadmin,
    'b2badmin': b2badmin,
    'auctionadmin': auctionadmin,
    'swuadmin': swuadmin
  };

  if (!role || !validCombinations[role] || secretKey !== validCombinations[role]) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid admin code or role" });
  }
  
  try {
    const existingAdmin = await adminModel.findOne({ email });
    if (existingAdmin)
      return res
        .status(400)
        .json({ success: false, message: "Admin already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new adminModel({
      fullName,
      email,
      password: hashedPassword,
      role: role,
      profileImage: profileImage,
      introduction: introduction 
    });
    await admin.save();

    // ✅ Generate JWT
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
      issuer: "HammerBidMart",
    });
//new lines
res.clearCookie("admin_token", { path: "/" });
res.clearCookie("employee_token", { path: "/" });
res.clearCookie("user_token", { path: "/" });
//new lines end
    res.cookie("admin_token", token, {
      httpOnly: true,
      //secure: process.env.NODE_ENV === "production",
      secure:true,
      sameSite: process.env.NODE_ENV === "production" ? "strict":"none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // ✅ Send Welcome email

    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: "Welcome to Hammer Bid Mart",
      html: `<div style="font-family: Poppins, Arial, sans-serif; background-color:#f8f9fb; padding:40px 20px; line-height:1.6; color:#10273F;">
          <div style="max-width:600px; margin:0 auto; background:#10273F; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:30px;">
    
            <!-- Logo -->
            <div style="text-align:left; margin-bottom:20px;">
              <img src="https://res.cloudinary.com/dn7cdtibf/image/upload/v1756019551/HBM-Logo-2_zjudqh.png" alt="HammerBidMart Logo" style="height:75px;"/>
            </div>
    
            <!-- Heading -->
            <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:center; color:#ffffff;">
              Welcome to
              <span style="color:#CFA128;">Hammer Bid Mart</span>
            </h2>
    
            <!-- Greeting -->
            <p style="margin:0 0 15px; font-size:16px; color:#fff">
              Hi <strong>${fullName}</strong>,
            </p>
    
            <!-- Intro Text -->
            <p style="margin:0 0 15px; font-size:16px; color:#fff;">
              Thank you for registering with <strong>Hammer Bid Mart</strong> as an Admin.
              Your admin account has been successfully registered.
              Get started by managing auctions, overseeing product listings, monitoring user activity, 
              and configuring platform settings to keep everything running smoothly.
            </p>
    
            <!-- CTA Button -->
            <div style="text-align:center; margin:30px 0;">
              <a href="${process.env.CLIENT_URL}/admin/dashboard"
                 style="display:inline-block; padding:12px 24px; background:#CFA128; color:#10273F; font-weight:600; font-size:16px; text-decoration:none; border-radius:6px;">
                 Go to Hammer Bid Mart
              </a>
            </div>
    
            <!-- Divider -->
            <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">
    
            <!-- Footer -->
            <p style="margin:0; font-size:14px; color:#fff; text-align:center;">
              © 2026 <strong>Hammer Bid Mart</strong>. All rights reserved.
            </p>
    
          </div>
       </div>`,
    });

    return res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      role: admin.role
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Admin Login ----------------
export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required" });

  try {
    const admin = await adminModel.findOne({ email });
    if (!admin)
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });

    const isPasswordMatched = await bcrypt.compare(password, admin.password);
    if (!isPasswordMatched)
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
      issuer: "HammerBidMart",
    });
//new lines
res.clearCookie("admin_token", { path: "/" });
res.clearCookie("employee_token", { path: "/" });
res.clearCookie("user_token", { path: "/" });
//new lines end
    res.cookie("admin_token", token, {
      httpOnly: true,
      //secure: process.env.NODE_ENV === "production",
      secure:true,
      sameSite: process.env.NODE_ENV === "production" ?  "strict": "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    console.log("🍀 Admin logged in:", token);
    return res.status(200).json({
      success: true,
      message: "Admin logged in successfully",
      role: admin.role
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Admin Logout ----------------
export const adminLogout = async (req, res) => {
  try {
    res.clearCookie("admin_token", {
      httpOnly: true,
      //secure: process.env.NODE_ENV === "production",
      secure:true,
      sameSite: process.env.NODE_ENV === "production" ? "strict":"none",
    });
    return res.status(200).json({
      success: true,
      message: "Admin logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Admin Authenticated ----------------
export const isAuthenticated = async (req, res) => {
  try {
    // At this point, adminAuth has already validated the token
    
    
    return res.status(200).json({
      success: true,
      adminId: req.adminId, // Include useful context for the frontend
    });
  } catch (error) {
    console.error("isAuthenticated error:", error); // Optional debugging
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// ---------------- Send Reset Password OTP ----------------
export const sendResetPasswordOtp = async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });

  try {
    const admin = await adminModel.findOne({ email });
    if (!admin)
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const hashedOtp = await bcrypt.hash(otp, 10);
    admin.resetOtp = hashedOtp;
    admin.resetOtpExpiryAt = Date.now() + 5 * 60 * 1000;
    await admin.save();

    const mailOptions = {
      from: process.env.SM,
      to: admin.email,
      subject: "Password Reset OTP",
      html: `<div style="font-family: Poppins, Arial, sans-serif; background-color:#f8f9fb; padding:40px 20px; line-height:1.6; color:#10273F;">
     <div style="max-width:600px; margin:0 auto; background:#10273F; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:30px;">
  
       <!-- Logo -->
       <div style="text-align:left; margin-bottom:20px;">
         <img src="https://res.cloudinary.com/dn7cdtibf/image/upload/v1756019551/HBM-Logo-2_zjudqh.png" alt="Hammer Bid Mart Logo" style="height:75px;"/>
       </div>
  
       <!-- Heading -->
       <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:center; color:#ffffff;">
         Reset Your
         <span style="color:#CFA128;">Password</span>
       </h2>
  
       <!-- Greeting -->
       <p style="margin:0 0 15px; font-size:16px; color:#fff">
         Hi <strong>${admin.fullName
           ?.replace(/</g, "&lt;")
           .replace(/>/g, "&gt;")}</strong>,
       </p>
  
       <!-- Intro Text -->
       <p style="margin:0 0 15px; font-size:16px; color:#fff;">
         You requested to reset your <strong>Hammer Bid Mart</strong> account password. Please use the OTP below to verify your email address and securley continue with reset password process.
       </p>
  
       <!-- CTA Button -->
       <div style="text-align:center; margin:30px 0;">
         <p
            style="display:inline-block; padding:12px 90px; background:#CFA128; color:#10273F; font-weight:600; font-size:16px; text-decoration:none; border-radius:6px;">
            ${otp}
         </p>
       </div>
  
       <p style="margin:0 0 15px; font-size:16px; color:#fff;">
        This OTP is valid for the next <strong>5 minutes</strong>.
         If you didn’t request this, please ignore this email.
       </p>
  
       <!-- Divider -->
       <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">
  
       <!-- Footer -->
       <p style="margin:0; font-size:14px; color:#fff; text-align:center;">
         © 2026 <strong>Hammer Bid Mart</strong>. All rights reserved.
       </p>
  
     </div>
   </div>`,
    };
    await transporter.sendMail(mailOptions);

    return res
      .status(200)
      .json({ success: true, message: "Password reset OTP sent successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Reset Password ----------------
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword)
    return res.status(400).json({
      success: false,
      message: "Email, OTP and new password are required",
    });

  try {
    const admin = await adminModel.findOne({ email });
    if (!admin)
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });

    if (admin.resetOtpExpiryAt < Date.now())
      return res.status(400).json({ success: false, message: "OTP expired" });

    const isValidOtp = await bcrypt.compare(otp, admin.resetOtp || "");
    if (!isValidOtp)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    admin.resetOtp = "";
    admin.resetOtpExpiryAt = 0;
    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
