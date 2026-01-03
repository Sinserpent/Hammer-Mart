import userModel from "../models/user.model.js";

//export const getUserData = async (req, res) => {
//  try {
//    const { userId } = req;
//    const user = await userModel.findById(userId);
//    if (!user)
//      return res
//        .status(404)
//        .json({ success: false, message: "User not found" });

//    return res.status(200).json({
//      success: true,
//      message: "User data fetched successfully",
//      userData: {
//        _id: user._id,
//        fullName: user.fullName,
//        role: user.role,
//        email: user.email,
//        businessName: user.businessName,
//        businessEmail: user.businessEmail,
//        isAccountVerified: user.isAccountVerified,
//        profileImage: user.profileImage
//      },
//    });
//  } catch (error) {
//    return res.status(500).json({ success: false, message: error.message });
//  }
//}; 

export const getUserData = async (req, res) => {
  try {
    const { userId } = req;

    const user = await userModel.findById(userId).lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User data fetched successfully",
      userData: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



export const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find({});
    
    //console.log("Fetched users:", users); // 🔹 print before returning

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
