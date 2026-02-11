import { mysql_db } from "../db_config/mysql_connect.js";
import { UserModel } from "../db_config/mongo_schemas/chat_schema.js";

/**
 * Syncs a user from MySQL to MongoDB if they don't exist or data is stale
 * @param {number} userId 
 */
export const syncUserToMongo = async (userId) => {
    try {
        if (!userId) return null;

        // 1. Fetch from MySQL
        const [rows] = await mysql_db.query(
            `SELECT u.user_id, u.full_name, u.profile_picture, u.email 
             FROM users u WHERE u.user_id = ?`,
            [userId]
        );

        if (rows.length === 0) return null;

        const user = rows[0];

        // 2. Upsert to MongoDB
        const mongoUser = await UserModel.findOneAndUpdate(
            { _id: userId },
            {
                name: user.full_name,
                avatar: user.profile_picture,
                email: user.email,
            },
            { upsert: true, new: true }
        );

        return mongoUser;
    } catch (error) {
        console.error(`Error syncing user ${userId} to Mongo:`, error);
        return null;
    }
};

/**
 * Sync multiple users to Mongo
 * @param {Array<number>} userIds 
 */
export const syncMultipleUsersToMongo = async (userIds) => {
    if (!userIds || userIds.length === 0) return;
    const uniqueIds = [...new Set(userIds)];
    await Promise.all(uniqueIds.map(id => syncUserToMongo(id)));
};
