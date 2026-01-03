import express from "express";
import { getAdminData } from "../controllers/admin.controller.js";
import adminAuth from "../middleware/admin.auth.js";

const adminUserRouter = express.Router();

adminUserRouter.get("/getAdminData", adminAuth, getAdminData); // ✅

export default adminUserRouter;
