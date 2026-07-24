import type { ErrorRequestHandler } from "express";
import type { Request, Response, NextFunction } from "express";
import multer from "multer";

export const fileErrorHandler: ErrorRequestHandler = (
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ success: false, message: "File too large" });
      return;
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      res.status(400).json({ success: false, message: "Unexpected File" });
      return;
    }
    res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    res.status(400).json({ success: false, message: err.message });
  }
  next();
};
