import type { Response, Request } from "express";
import { findUser, createUser } from "../model/userModel.js";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken} from "../services/jwt.js";
import redis from "../config/redisCon.js";

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, email, password} = req.body as {username: string, email: string | null, password: string};
        
        if(!username || !password){
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
        const user = await findUser(username);
        if(!user?.username){
            res.status(401).json({success: false, message: "Username Does not exist"});
            return;
        }
        let isValid = await bcrypt.compare(password, user.password);
        if(!isValid){
            res.status(401).json({success: false, message: "Wrong password"});
            return;
        };
    
        const accessToken = generateAccessToken({UID: user.UID, username: user.username});
        const refreshToken = generateRefreshToken({UID: user.UID, username: user.username});

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        await redis.setex(`user:${user.UID}`, 3600, JSON.stringify({UID: user.UID, username: user.username}));
        res.status(200).json({success: true, message: "Successfully loged In", accessToken});
    } catch (error) {
        console.log("Login Error: ", error);
        res.status(500).json({success: false, message: "Server Error"});
    }
}