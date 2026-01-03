import express from "express";
import { getAllUsers, getUserData } from "../controllers/user.controller.js";
import userAuth from "../middleware/user.auth.js";

const userRouter = express.Router();

userRouter.get("/getUserData", userAuth, getUserData); // ✅
userRouter.get('/getAll', getAllUsers)
export default userRouter;
    