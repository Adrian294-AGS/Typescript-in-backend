import pool from "../config/msqlCon.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { v4 as uuidv4} from "uuid";

interface RegisterUser {
    username: string,
    password: string,
    email?: string | null
};

interface userInfo extends RowDataPacket{
    UID: string,
    password: string,
    username: string,
    role: string,
    email?: string
};

export const createUser = async ({username, password, email}: RegisterUser): Promise<ResultSetHeader> => {
    const newId: string = uuidv4()
    const [result] = await pool.execute<ResultSetHeader>(`INSERT INTO tbl_user (UID, username, password, email) VALUES (?, ?, ?, ?)`, [newId, username, password, email ?? null]);
    return result;
};

export const findUser = async (username: string): Promise<userInfo | null> => {
    const [result] = await pool.execute<userInfo[]>("SELECT UID, username, password FROM tbl_user WHERE username = ?", [username]);
    return result[0] ?? null;
};


