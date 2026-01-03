import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";

export const updateAdminImageController = async (req, res) => {
  try {
    const token = req.cookies.admin_token || req.cookies.user_token;
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminId = decoded.id;

    if (!req.uploadedImages || req.uploadedImages.length === 0) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { profileImage: req.uploadedImages[0] },
      { new: true }
    );

    if (!updatedAdmin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    return res.json({
      message: "Image updated",
      image: updatedAdmin.Image
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateAdminProfileController = async (req, res) => {
  try {
    const token = req.cookies.admin_token;
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminId = decoded.id;

    const admin = await User.findById(adminId);
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    const { fullName } = req.body;
    if (!fullName) return res.status(400).json({ error: "Full name is required" });

    const updatedAdmin = await User.findByIdAndUpdate(
      adminId,
      { fullName },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.json({
      message: "Admin profile updated successfully",
      admin: {
        _id: updatedAdmin._id,
        fullName: updatedAdmin.fullName,
        email: updatedAdmin.email,
        role: updatedAdmin.role
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};