import pool from "../config/msqlCon.js";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { v4 as uuidv4} from "uuid";

interface RegisterUser {
    username: string,
    password: string,
    email?: string | null
};

interface RegisterUserOauth {
    username: string,
    email?: string | null,
    provider: string,
    providerUserId: string,
    refreshToken?: string | null
};

interface UserInfo extends RowDataPacket{
    UID: string,
    password: string,
    username: string,
    role: string,
    email?: string
};

interface UserOauthAccount extends RowDataPacket {
    UID: string,
    username: string,
    role: string,
    email?: string
}

export const createUser = async ({username, password, email}: RegisterUser): Promise<ResultSetHeader> => {
    const newId: string = uuidv4()
    const [result] = await pool.execute<ResultSetHeader>(`INSERT INTO tbl_user (UID, username, password, email) VALUES (?, ?, ?, ?)`, [newId, username, password, email ?? null]);
    return result;
};

export const findUser = async (username: string): Promise<UserInfo | null> => {
    const [result] = await pool.execute<UserInfo[]>("SELECT UID, username, password FROM tbl_user WHERE username = ?", [username]);
    return result[0] ?? null;
};

export const findUserOauth = async (id: string, provider: string): Promise<UserOauthAccount | null> => {
    const [result] = await pool.execute<UserOauthAccount[]>("SELECT UID, username, role, email from tbl_user AS A INNER JOIN tbl_oauth_account AS B ON A.UID = B.UID WHERE B.provider = ? AND B.provider_user_id = ?", [provider, id]);
    return result[0] ?? null;
};

export const createUserOauth = async ({username, email, provider, providerUserId, refreshToken}: RegisterUserOauth): Promise<ResultSetHeader> => {
    const newId: string = uuidv4();
    const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO tbl_user (UID, username, email) VALUES (?, ?, ?)`,
        [newId, username, email ?? null]
    );
    await pool.execute(
        `INSERT INTO tbl_oauth_account (UID, provider, provider_user_id, refresh_token) VALUES (?, ?, ?, ?)`,
        [newId, provider, providerUserId, refreshToken ?? null]
    );
    return result;
};

export const updateOauthRefreshToken = async (provider: string, providerUserId: string, refreshToken: string): Promise<ResultSetHeader> => {
    const [result] = await pool.execute<ResultSetHeader>(
        `UPDATE tbl_oauth_account SET refresh_token = ? WHERE provider = ? AND provider_user_id = ?`,
        [refreshToken, provider, providerUserId]
    );
    return result;
};
