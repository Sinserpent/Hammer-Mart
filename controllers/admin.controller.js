import adminModel from "../models/admin.model.js";

export const getAdminData = async (req, res) => { 
  try {
    const { adminId } = req;
    const admin = await adminModel.findById(adminId);
    if (!admin)
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    return res.status(200).json({
      success: true,
      message: "Admin data fetched successfully",
      adminData: {
        _id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        profileImage: admin.profileImage
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
