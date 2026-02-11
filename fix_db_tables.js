import { mysql_db } from "./db_config/mysql_connect.js";
import dotenv from "dotenv";
dotenv.config();

const createTables = async () => {
    try {
        const connection = await mysql_db.getConnection();
        console.log("Connected to MySQL DB");

        // Create user_stats table
        const userStatsQuery = `
            CREATE TABLE IF NOT EXISTS user_stats (
                user_id INT PRIMARY KEY,
                followers_count INT DEFAULT 0,
                following_count INT DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        `;
        await connection.query(userStatsQuery);
        console.log("Checked/Created user_stats table");

        // Create user_follows table
        const userFollowsQuery = `
            CREATE TABLE IF NOT EXISTS user_follows (
                id INT AUTO_INCREMENT PRIMARY KEY,
                follower_id INT NOT NULL,
                following_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_follow (follower_id, following_id),
                FOREIGN KEY (follower_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (following_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        `;
        await connection.query(userFollowsQuery);
        console.log("Checked/Created user_follows table");

        // Check if user_stats entries exist for existing users and create them if not
        const [users] = await connection.query("SELECT user_id FROM users");
        for (const user of users) {
            const [stats] = await connection.query("SELECT user_id FROM user_stats WHERE user_id = ?", [user.user_id]);
            if (stats.length === 0) {
                await connection.query("INSERT INTO user_stats (user_id) VALUES (?)", [user.user_id]);
                console.log(`Created stats for user ${user.user_id}`);
            }
        }

        console.log("Database migration completed successfully");
        connection.release();
        process.exit(0);

    } catch (error) {
        console.error("Error creating tables:", error);
        process.exit(1);
    }
};

createTables();
