import { mysql_db } from "./db_config/mysql_connect.js";
import dotenv from "dotenv";
dotenv.config();

const checkSchema = async () => {
    try {
        const connection = await mysql_db.getConnection();
        console.log("Connected to MySQL DB");

        const [rows] = await connection.query("DESCRIBE users");
        console.log("Users table schema:", rows);

        connection.release();
        process.exit(0);
    } catch (error) {
        console.error("Error checking schema:", error);
        process.exit(1);
    }
};

checkSchema();
