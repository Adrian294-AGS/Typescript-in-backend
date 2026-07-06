import mysql from "mysql2/promise";
import type { PoolOptions, RowDataPacket, ResultSetHeader } from "mysql2/promise";

const buildPoolOptions = (): PoolOptions => {
    const options: PoolOptions = {
        user: process.env['MYSQL_USER'] ?? "root",
        password: process.env['MYSQL_PASS'] ?? "",
        host: process.env['MYSQL_HOST'] ?? 'localhost',
        port: Number(process.env['MYSQL_PORT']) ?? 3306,
        database: process.env['MYSQL_DATABASE'] ?? 'typeScriptCourse_DB',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
    return options;
};
interface User extends RowDataPacket {
    UID: number
    username: string,
    password: string,
    email: string,
    created_at: Date
};

interface RegisterUser {
    username: string,
    password: string,
    email?: string
};

const sampleUser: RegisterUser = {
    username: "Adrian",
    password: "dasdadadadaijewfwihfwfeifwfiwiejw",
    email: "stgoadrian294@gmail.com"
};

const pool = mysql.createPool(buildPoolOptions());

const findUser = async (username: string): Promise<User | null> => {
    const [ result ] = await pool.execute<User[]>("SELECT * FROM tbl_user WHERE username = ?", [username]);
    return result[0] ?? null;
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

await findUser("Adrian").then((v) => console.log(v));




