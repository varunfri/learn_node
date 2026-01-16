import { mysql_db } from "../db_config/mysql_connect.js";

export const get_all_user_profiles = async (req, res) => {
    try {
        const [result] = await mysql_db.query(
            `SELECT u.user_id, u.full_name,
             COALESCE(un.username, '') AS username,
             u.profile_picture, ul.country, ul.country_code,
             COALESCE(uvl.vip_level_id, 0) AS vip_level_id
             FROM users u LEFT JOIN usernames un ON
             un.user_id = u.user_id AND un.is_active = 1
             LEFT JOIN user_location ul ON ul.location_id = 
             ( SELECT MAX(location_id) FROM user_location
              WHERE user_id = u.user_id ) LEFT JOIN user_vip_levels uvl
              ON uvl.user_id = u.user_id AND uvl.is_active = 1 
              WHERE u.is_active = 1 ORDER BY u.created_at DESC;`
        );

        if (result.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "No users found"
            });
        }

        return res.status(200).json({
            status: 200,
            message: "User profiles fetched",
            data: result
        });
    } catch (e) {
        console.log("Error while getting all users: ", e);
        return res.status(500).json({
            status: 500,
            message: `Internal Server Error: ${e}`
        });
    }
};

