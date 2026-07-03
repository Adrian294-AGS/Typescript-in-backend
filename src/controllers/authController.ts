import type {Request, Response} from "express";
import { findUser, createUser } from "../model/userModel.js";
import bcrypt from "bcryptjs";

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, email, password} = req.body as {username: string, email: string, password: string};

        if(!username || !email || !password){
            res.status(401).json({success: false, message: "Invalid Input Field"});
            return;
        }

        const existingUser = await findUser(username);
        if(existingUser){
            res.status(400).json({success: false, message: `${username} is Already Taken`});
            return;
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await createUser({username, email, password: hashedPassword});
        res.status(201).json({success: true, message: "User Created Successfully"});
    } catch (error) {
        console.log("RegisteController Error", error);
        res.status(500).json({success: false, message: "Server Error"})
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const {username, password, retryPassword} = req.body as {username: string, password: string, retryPassword: string};
        if(password !== retryPassword){
            res.status(401).json({success: false, message: "Unmatched Password"});
            return;
        }
        
    } catch (error) {
        console.log("Login Error: ", error);
        res.status(500).json({success: false, message: "Server Error"});
    }
}