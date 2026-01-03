// route.js
import express from "express";
import { upload } from "../middleware/multer.config.js";
import { uploadToCloudinaryController } from "../controllers/cloudinary.controller.js";
import { updateUserImageController, updateUserProfileController } from "../controllers/user.profile.controller.js";
import { updateAdminImageController,updateAdminProfileController } from "../controllers/admin.profile.controller.js";

const router = express.Router();

router.post(
  "/image",
  upload.array("image",1),
  uploadToCloudinaryController,
  updateUserImageController
);

router.post(
  "/admin/image",
  upload.array("image",1),
  uploadToCloudinaryController,
  updateAdminImageController 
);


router.put("/update-profile", updateUserProfileController);
router.put("/admin/update-profile", updateAdminProfileController);

export default router;
