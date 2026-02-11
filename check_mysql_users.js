import { mysql_db } from "./db_config/mysql_connect.js";

const checkUsers = async () => {
    try {
        const [rows] = await mysql_db.query("SELECT user_id, full_name, email FROM users LIMIT 5");
        console.log("MySQL Users:", JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

checkUsers();
