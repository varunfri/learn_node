import { mysql_db } from "../db_config/mysql_connect.js";

export const get_video_lives = async (req, res) => {
    try {
        const [result] = await mysql_db.query(
            `SELECT
    u.user_id,
    u.full_name,
    COALESCE(un.username, '') AS username,
    u.profile_picture,
    ul.country,
    ul.country_code,
    COALESCE(uvl.vip_level_id, 0) AS vip_level_id,
    us.stream_id,
    us.stream_url,
    us.started_at
    FROM user_streams us
    INNER JOIN users u
        ON u.user_id = us.user_id
        AND u.is_active = 1
    LEFT JOIN usernames un
        ON un.user_id = u.user_id
        AND un.is_active = 1
    LEFT JOIN user_location ul
        ON ul.location_id = (
            SELECT MAX(location_id)
            FROM user_location
            WHERE user_id = u.user_id
        )
    LEFT JOIN user_vip_levels uvl
        ON uvl.user_id = u.user_id
        AND uvl.is_active = 1
    WHERE us.is_live = 1
    AND us.is_audio = 0
    ORDER BY
    COALESCE(uvl.vip_level_id, 0) DESC,
    us.started_at DESC;`
        );

        if (result.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "No video rooms found"
            });
        }

        return res.status(200).json({
            status: 200,
            message: "Live video rooms found",
            data: result,
        })
    } catch (e) {
        console.log("Error while executing get_live_users: ", e);
        return res.status(500).json({
            status: 500,
            message: "Internal server error"
        });
    }
};

export const get_audio_lives = async (req, res) => {
    try {
        const [result] = await mysql_db.query(
            `SELECT
    u.user_id,
    u.full_name,
    COALESCE(un.username, '') AS username,
    u.profile_picture,
    ul.country,
    ul.country_code,
    COALESCE(uvl.vip_level_id, 0) AS vip_level_id,
    us.stream_id,
    us.stream_url,
    us.started_at
    FROM user_streams us
    INNER JOIN users u
        ON u.user_id = us.user_id
        AND u.is_active = 1
    LEFT JOIN usernames un
        ON un.user_id = u.user_id
        AND un.is_active = 1
    LEFT JOIN user_location ul
        ON ul.location_id = (
            SELECT MAX(location_id)
            FROM user_location
            WHERE user_id = u.user_id
        )
    LEFT JOIN user_vip_levels uvl
        ON uvl.user_id = u.user_id
        AND uvl.is_active = 1
    WHERE us.is_live = 1
    AND us.is_audio = 1
    ORDER BY
        COALESCE(uvl.vip_level_id, 0) DESC,
        us.started_at DESC;`
        );

        if (result.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "No audio rooms found"
            });
        }

        return res.status(200).json({
            status: 200,
            message: "Live Audio rooms fetched",
            data: result
        });
    } catch (e) {
        console.log("Error while executing get_live_users: ", e);
        return res.status(500).json({
            status: 500,
            message: "Internal server error"
        });
    }
};