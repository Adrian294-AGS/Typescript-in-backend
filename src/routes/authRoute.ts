import { Router } from "express";
import { register, login } from "../controllers/authController.js";
import { loginLimiter } from "../middleware/buildLimiter.js";

const authRoute = Router();

authRoute.post("/register", register);
authRoute.post("/login", loginLimiter, login);

export default authRoute;