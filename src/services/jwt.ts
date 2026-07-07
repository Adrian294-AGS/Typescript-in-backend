import jwt from "jsonwebtoken";

interface JwtPayload {
    UID: number,
    username: string,
}

const AccessSecret = process.env['JWT_ACCESS_SECRET'] as string;
const RefreshSecret = process.env["JWT_REFRESH_SECRET"] as string;

export const generateAccessToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, AccessSecret, { expiresIn: '15m' });
};

export const generateRefreshToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, RefreshSecret, {expiresIn: "7d"});
};

export const verifyAccessToken = (accessToken: string): JwtPayload => {
    return jwt.verify(accessToken, AccessSecret) as JwtPayload;
};

export const verifyRefreshToken = (refreshToken: string): JwtPayload => {
    return jwt.verify(refreshToken, RefreshSecret) as JwtPayload;
};

