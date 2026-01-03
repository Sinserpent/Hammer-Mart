import express from "express";
import {
  employeeLogin,
  employeeLogout,
  employeeRegister,
  isAuthenticated,
  resetPassword,
  sendResetPasswordOtp,
} from "../controllers/employee.auth.controller.js";
import employeeAuth from "../middleware/employee.auth.js";
import { getEmployeeData } from "../controllers/employee.controller.js";
import { attachLinkToAllEmployees, deleteEmployeeReferenceEntry, getAllEmployeeReferences, getEmployeesByStarPoints } from "../controllers/star.controller.js";
const employeeRouter = express.Router();

// employee Register
employeeRouter.post("/register", employeeRegister); // ✅
// employee Login
employeeRouter.post("/login", employeeLogin); // ✅
// employee Logout
employeeRouter.post("/logout", employeeLogout); // ✅
// employee Authenticated
employeeRouter.get("/isAuthenticated", employeeAuth, isAuthenticated); // ✅
// Send Reset Password OTP
employeeRouter.post("/sendResetPasswordOtp", sendResetPasswordOtp); // ✅
// Reset Password
employeeRouter.post("/resetPassword", resetPassword); // ✅
// Get Employee Data
employeeRouter.get("/getEmployeeData", employeeAuth, getEmployeeData); // ✅


// Get Employee Stars
employeeRouter.get("/getEmployeesByStars", getEmployeesByStarPoints)
// Send Product recomendation link
employeeRouter.post("/sendLink", attachLinkToAllEmployees)
// Get All Registration links // Unique to every person
employeeRouter.get("/getLinks", getAllEmployeeReferences)
// Delete Link
employeeRouter.delete("/deleteLink", deleteEmployeeReferenceEntry)
export default employeeRouter;