import mysql from "mysql2/promise";
import type { PoolOptions } from "mysql2/promise";

const buildPoolOptions = (): PoolOptions => {
    const options: PoolOptions = {
        user: process.env['MYSQL_USER'] ?? "root",
        password: process.env['MYSQL_PASS'] ?? "",
        host: process.env['MYSQL_HOST'] ?? 'localhost',
        port: Number(process.env['MYSQL_PORT']) ?? 3306,
        database: process.env['MYSQL_DATABASE'] ?? 'test',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };
    return options;
};

const pool = mysql.createPool(buildPoolOptions());

export default pool;