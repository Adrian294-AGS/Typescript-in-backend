import multer from "multer";
import type { Request } from "express";
import path from "path";
import fs from "fs";
import type { FileFilterCallback } from "multer";

const uploadPath = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, uploadPath);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-").toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  },
});

const ALLOWED_MIME_TYPE: string[] =[
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if(ALLOWED_MIME_TYPE.includes(file.mimetype)){
    cb(null, true)
  } else {
    cb(new Error("Unsupported File"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5
  }
});


