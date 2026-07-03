import pool from "../config/msqlCon.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

interface RegisterUser {
    username: string,
    password: string,
    email?: string
};
interface userInfo extends RowDataPacket{
    UID: number,
    username: string,
    email?: string
};

export const createUser = async ({username, password, email}: RegisterUser): Promise<ResultSetHeader> => {
    const payload = {
        username,
        password,
        email: email ?? null
    }
    const [result] = await pool.execute<ResultSetHeader>(`INSERT INTO tbl_user SET ?`, [payload]);
    return result;
};

export const findUser = async (username: string): Promise<userInfo | null> => {
    const [result] = await pool.execute<userInfo[]>("SELECT username FROM tbl_user WHERE username = ?", [username]);
    return result[0] ?? null;
};


