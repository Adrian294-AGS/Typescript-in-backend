import type { Request, NextFunction, Response } from "express";
import { verifyAccessToken } from "../services/jwt.js";

export interface AuthRequest extends Request {
  user?: any;
}

export const jwt_authentication = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;
  const accessToken = authHeader && authHeader?.split(" ")[1];
  if (!accessToken) {
    res.status(401).json({ success: false, messsage: "Invalid Access Token" });
    return;
  }
  try {
    const decode = verifyAccessToken(accessToken);
    req.user = decode;
    next();
  } catch (error) {
    console.log("jwt_authentication ERROR: ", error);
    res.status(401).json({ success: false, message: "Access Token Expired" });
  }
};
