import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import transporter from "../config/nodemailer.js";

// ---------------- User Register ----------------
export const userRegister = async (req, res) => {
  const {
    role,
    fullName,
    email,
    password,
    businessName,
    businessEmail,
    businessContact,
    businessAddress,
    country,
    city,
    introduction
  } = req.body;
   
  const profileImage = req.body.images && req.body.images.length > 0 ? req.body.images[0] : null;
  console.log(req.body)

  if (!role || !["buyer", "seller"].includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }

  const requiredFields =
    role === "buyer"
      ? ["fullName", "email", "password"]
      : [
          "fullName",
          "businessName",
          "businessEmail",
          "businessContact",
          "businessAddress",
          "country",
          "city",
          "password",
          "introduction"
        ];

  const missingFields = requiredFields.filter((field) => !req.body[field]);
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }

  try {
    // ✅ Check duplicates based on role
    let existingUser;
    if (role === "buyer") {
      existingUser = await userModel.findOne({ email: email.toLowerCase() });
    } else {
      existingUser = await userModel.findOne({
        businessEmail: businessEmail.toLowerCase(),
      });
    }

    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create new user
    const user = new userModel({
      role,
      fullName,
      profileImage: profileImage,
      email: role === "buyer" ? email.toLowerCase() : undefined,
      password: hashedPassword,
      businessName: role === "seller" ? businessName : undefined,
      businessEmail:
        role === "seller" ? businessEmail.toLowerCase() : undefined,
      businessContact: role === "seller" ? businessContact : undefined,
      businessAddress: role === "seller" ? businessAddress : undefined,
      country: role === "seller" ? country : undefined,
      city: role === "seller" ? city : undefined,
      introduction: role === "seller" ? introduction : undefined
    });

    await user.save();

    // ✅ Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d", issuer: "HammerBidMart" }
    );
//new lines
res.clearCookie("admin_token", { path: "/" });
res.clearCookie("employee_token", { path: "/" });
res.clearCookie("user_token", { path: "/" });
//new lines end
    res.cookie("user_token", token, {
      httpOnly: true,
      //secure: process.env.NODE_ENV === "production",
      secure:true,
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "none" ,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // ✅ Send welcome email
    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to: role === "buyer" ? email : businessEmail,
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
              Thank you for registering with <strong>Hammer Bid Mart</strong>.
              We’re excited to have you onboard! 🚀
              Get started by exploring auctions, browsing products, or setting up your seller profile today.
            </p>
    
            <!-- CTA Button -->
            <div style="text-align:center; margin:30px 0;">
              <a href="${process.env.CLIENT_URL}"
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
      message: "User registered successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- User Login ----------------
export const userLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res
      .status(400)
      .json({ success: false, message: "Email and password are required" });

  try {
    const user = await userModel.findOne({
      $or: [
        { email: email.toLowerCase() },
        { businessEmail: email.toLowerCase() },
      ],
    });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched)
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d", issuer: "HammerBidMart" }
    );
    console.log(token);
    
//NEW LINES ADDED
res.clearCookie("admin_token", { path: "/" });
res.clearCookie("employee_token", { path: "/" });
res.clearCookie("user_token", { path: "/" });
//NEW LINES END
    res.cookie("user_token", token, {
      httpOnly: true,
      //secure: process.env.NODE_ENV === "production", //false     //https
      secure:true,
      sameSite: process.env.NODE_ENV === "production" ?  "strict" : "none" ,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- User Logout ----------------
export const userLogout = async (req, res) => {
  try {
    res.clearCookie("user_token", {
      httpOnly: true,
      //secure: process.env.NODE_ENV === "production",
      secure:true,
      sameSite: process.env.NODE_ENV === "production" ? "strict":"none",
    });
    return res
      .status(200)
      .json({ success: true, message: "User logged out successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Send Verification OTP ----------------
export const sendVerificationOtp = async (req, res) => {
  try {
    const { userId } = req;
    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.isAccountVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Account already verified" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.verifyOtp = await bcrypt.hash(otp, 10);
    user.verifyOtpExpiryAt = Date.now() + 5 * 60 * 1000;

    await user.save();

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: user.email || user.businessEmail,
      subject: "Account Verification OTP",
      html: `<div style="font-family: Poppins, Arial, sans-serif; background-color:#f8f9fb; padding:40px 20px; line-height:1.6; color:#10273F;">
     <div style="max-width:600px; margin:0 auto; background:#10273F; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); padding:30px;">
  
       <!-- Logo -->
       <div style="text-align:left; margin-bottom:20px;">
         <img src="https://res.cloudinary.com/dn7cdtibf/image/upload/v1756019551/HBM-Logo-2_zjudqh.png" alt="Hammer Bid Mart Logo" style="height:75px;"/>
       </div>
  
       <!-- Heading -->
       <h2 style="margin:0 0 20px; font-size:24px; font-weight:600; text-align:center; color:#ffffff;">
         Verify Your
         <span style="color:#CFA128;">Email Address</span>
       </h2>
  
       <!-- Greeting -->
       <p style="margin:0 0 15px; font-size:16px; color:#fff">
         Hi <strong>${user.fullName
           ?.replace(/</g, "&lt;")
           .replace(/>/g, "&gt;")}</strong>,
       </p>
  
       <!-- Intro Text -->
       <p style="margin:0 0 15px; font-size:16px; color:#fff;">
         To complete your registration with <strong>Hammer Bid Mart</strong>, please verify your email address by entering the OTP below.
         This helps us keep your account secure.
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
      .json({ success: true, message: "Verification OTP sent successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Verify Account ----------------
export const verifyAccount = async (req, res) => {
  const { otp } = req.body;
  const { userId } = req;

  if (!otp)
    return res.status(400).json({ success: false, message: "OTP is required" });

  try {
    const user = await userModel.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (user.verifyOtpExpiryAt < Date.now())
      return res.status(400).json({ success: false, message: "OTP expired" });

    const isValidOtp = await bcrypt.compare(otp, user.verifyOtp || "");
    if (!isValidOtp)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    user.isAccountVerified = true;
    user.verifyOtp = "";
    user.verifyOtpExpiryAt = 0;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Account verified successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- User Authenticated ----------------
export const isAuthenticated = async (req, res) => {
  try {
    // At this point, userAuth has already validated the token
    return res.status(200).json({
      success: true,
      userId: req.userId, // Include useful context for the frontend
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
    const user = await userModel.findOne({
      $or: [{ email }, { businessEmail: email }],
    });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.resetOtp = hashedOtp;
    user.resetOtpExpiryAt = Date.now() + 5 * 60 * 1000;
    await user.save();

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: user.email || user.businessEmail,
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
         Hi <strong>${user.fullName
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
    const user = await userModel.findOne({
      $or: [{ email }, { businessEmail: email }],
    });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (user.resetOtpExpiryAt < Date.now())
      return res.status(400).json({ success: false, message: "OTP expired" });

    const isValidOtp = await bcrypt.compare(otp, user.resetOtp || "");
    if (!isValidOtp)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtp = "";
    user.resetOtpExpiryAt = 0;

    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
