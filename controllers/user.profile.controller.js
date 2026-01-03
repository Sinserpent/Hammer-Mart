// user.controller.js
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const updateUserImageController = async (req, res) => {
  try {
    const token = req.cookies.user_token || req.cookies.admin_token;
    if (!token) return res.status(401).json({ error: "No token provided" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    if (!req.uploadedImages || req.uploadedImages.length === 0) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { profileImage: req.uploadedImages?.[0] },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({ success:true, message: "Image updated", image: user.image });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateUserProfileController = async (req, res) => {
  try {
    const token = req.cookies.user_token || req.cookies.admin_token;
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    let updateData = {};

    if (user.role === "buyer") {
      const { fullName, email } = req.body;
      if (fullName) updateData.fullName = fullName;
      if (email) updateData.email = email;
    } else if (user.role === "seller") {
      const {
        fullName,
        businessName,
        businessContact,
        businessEmail,
        businessAddress,
        country,
        city,
        introduction
      } = req.body;

      if (fullName) updateData.fullName = fullName;
      if (businessName) updateData.businessName = businessName;
      if (businessContact) updateData.businessContact = businessContact;
      if (businessEmail) updateData.businessEmail = businessEmail;
      if (businessAddress) updateData.businessAddress = businessAddress;
      if (country) updateData.country = country;
      if (city) updateData.city = city;
      if (introduction) updateData.introduction = introduction
    } else {
      return res.status(403).json({ error: "Invalid user role" });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    return res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

