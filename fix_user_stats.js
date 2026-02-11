import { mysql_db } from "./db_config/mysql_connect.js";

const fixUserStats = async () => {
    try {
        const connection = await mysql_db.getConnection();

        console.log("Creating user_stats table...");

        const query = `
            CREATE TABLE IF NOT EXISTS user_stats (
              user_id bigint NOT NULL,
              followers_count int DEFAULT '0',
              following_count int DEFAULT '0',
              PRIMARY KEY (user_id),
              CONSTRAINT fk_user_stats FOREIGN KEY (user_id) REFERENCES users (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await connection.query(query);
        console.log("user_stats table created successfully!");

        // Optional: seed existing users
        console.log("Seeding user_stats for existing users...");
        await connection.query(`
            INSERT IGNORE INTO user_stats (user_id, followers_count, following_count)
            SELECT user_id, 0, 0 FROM users
        `);
        console.log("Seeding complete.");

        connection.release();
        process.exit(0);
    } catch (e) {
        console.error("Error creating table:", e);
        process.exit(1);
    }
};

fixUserStats();
