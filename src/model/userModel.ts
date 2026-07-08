import pool from "../config/msqlCon.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

interface RegisterUser {
    username: string,
    password: string,
    email?: string | null
};

interface userInfo extends RowDataPacket{
    UID: number,
    password: string,
    username: string,
    email?: string
};

export const createUser = async ({username, password, email}: RegisterUser): Promise<ResultSetHeader> => {
    const [result] = await pool.execute<ResultSetHeader>(`INSERT INTO tbl_user (username, password, email) VALUES (?, ?, ?)`, [username, password, email ?? null]);
    return result;
};

export const findUser = async (username: string): Promise<userInfo | null> => {
    const [result] = await pool.execute<userInfo[]>("SELECT UID, username, password FROM tbl_user WHERE username = ?", [username]);
    return result[0] ?? null;
};


