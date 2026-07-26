import { upload } from "../config/multerConfig.js";
import type { Request, Response, NextFunction } from "express";

export const uploadSingleFile = (fileName: string) => {
    const uploadedFile = upload.single(fileName);
    return (req: Request, res: Response, next: NextFunction) => {
        uploadedFile(req, res, (error) => {
            if(error){
                return next(error);
            }
            next();
        })
    }
};

export const uploadMultipleFile = (fieldName: string, maxCount: number) => {
    const uploadedFile = upload.array(fieldName, maxCount);
    return (req: Request, res: Response, next: NextFunction) => {
        uploadedFile(req, res, (error) => {
            if(error){
                return next(error);
            }
            next();
        })
    }
};