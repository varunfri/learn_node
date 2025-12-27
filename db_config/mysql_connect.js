import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const mysql_db = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true
});

export const connect_mysql = async () => {
    try {
        await mysql_db.getConnection();
        console.log("Connected to mysql");
    } catch (e) {
        console.error("Connection failed to mysql", e);
        process.exit(1);
    }
};