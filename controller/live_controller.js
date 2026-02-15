import { mysql_db } from "../db_config/mysql_connect.js";
import { getIO } from "../utils/init_socket.js";
import crypto from 'crypto';


export const go_live = async (req, res) => {
    const user_id = req.user.id;
    const { is_audio } = req.body;

    if (typeof is_audio !== 'boolean') {
        return res.status(400).json({
            status: 400,
            message: "is_audio must be boolean"
        });
    }

    const connection = await mysql_db.getConnection();

    try {
        await connection.beginTransaction();

        const [existing] = await connection.query(
            `SELECT stream_id, status 
         FROM user_streams 
         WHERE user_id = ?
         AND status IN ('created', 'paused', 'live')
         LIMIT 1`,
            [user_id]
        );

        let stream_id;
        let shouldCreateNew = false;

        if (existing.length === 0) {
            shouldCreateNew = true;
        } else {
            const { stream_id: existingStreamId, status } = existing[0];

            if (status === 'live') {
                // User is already live (stale session), end it and create new
                await connection.query(
                    `UPDATE user_streams 
                     SET status = 'end', ended_at = NOW() 
                     WHERE stream_id = ?`,
                    [existingStreamId]
                );
                shouldCreateNew = true;
            } else {
                // Paused or created → resume / go live
                stream_id = existingStreamId;

                await connection.query(
                    `UPDATE user_streams
                     SET status = 'live'
                     WHERE stream_id = ?`,
                    [stream_id]
                );
            }
        }

        if (shouldCreateNew) {
            const stream_key = crypto.randomBytes(16).toString('hex');
            const [insert] = await connection.query(
                `INSERT INTO user_streams 
                 (user_id, is_audio, status, started_at, stream_key) 
                 VALUES (?, ?, 'live', NOW(), ?)`,
                [user_id, is_audio ? 1 : 0, stream_key]
            );

            stream_id = insert.insertId;
        }

        await connection.commit();

        // Notify clients
        const io = getIO();
        io.emit('stream_went_live', {
            stream_id,
            user_id,
            is_audio,
            timestamp: new Date()
        });

        res.status(200).json({
            status: 200,
            message: "Stream is live",
            data: {
                stream_id,
                status: "live"
            }
        });

    } catch (err) {
        await connection.rollback();
        console.error("go_live error:", err);

        // Self-healing: Drop the unique index if it exists and retry
        // uniq_user_live_stream prevents users from having >1 not-live stream (is_live=0) which is wrong.
        if (err.code === 'ER_DUP_ENTRY' && (err.message.includes('uniq_user_live_stream') || (err.sqlMessage && err.sqlMessage.includes('uniq_user_live_stream')))) {
            try {
                console.log("Found problematic unique index 'uniq_user_live_stream'. Dropping it...");
                // Note: ALTER TABLE causes implicit commit, but we already rolled back above.
                // We use a fresh query here (not part of the failed transaction).
                await mysql_db.query("ALTER TABLE user_streams DROP INDEX uniq_user_live_stream");
                console.log("Index dropped successfully.");

                return res.status(500).json({
                    status: 500,
                    message: "Database schema updated (problematic index dropped). PLEASE TRY GOING LIVE AGAIN IMMEDIATELY."
                });

            } catch (dropErr) {
                console.error("Failed to drop index:", dropErr);
            }
        }

        res.status(500).json({
            status: 500,
            message: "Unable to go live: " + (err.sqlMessage || err.message)
        });
    } finally {
        connection.release();
    }
};


export const pause_live = async (req, res) => {
    const user_id = req.user.id;
    const { stream_id } = req.params;

    if (!stream_id) {
        return res.status(400).json({
            status: 400,
            message: "stream_id is required"
        });
    }

    const connection = await mysql_db.getConnection();

    try {
        await connection.beginTransaction();

        // Verify stream belongs to user and is live
        const [stream] = await connection.query(
            `SELECT stream_id, is_audio FROM user_streams WHERE stream_id = ? AND user_id = ? AND status = 'live'`,
            [stream_id, user_id]
        );

        if (stream.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "Stream not found or not live"
            });
        }

        // Update stream to paused
        const [updateResult] = await connection.query(
            `UPDATE user_streams 
             SET status = 'paused', paused_at = NOW() 
             WHERE stream_id = ?`,
            [stream_id]
        );

        if (updateResult.affectedRows !== 1) {
            throw new Error("Failed to pause stream");
        }

        await connection.commit();

        // Emit socket event
        const io = getIO();
        io.emit('stream_paused', {
            stream_id,
            user_id,
            timestamp: new Date()
        });

        res.status(200).json({
            status: 200,
            message: "Stream paused successfully",
            data: {
                stream_id,
                is_paused: true
            }
        });

    } catch (e) {
        await connection.rollback();
        console.log("Error pausing stream:", e);
        res.status(500).json({
            status: 500,
            message: "Internal server error: Unable to pause stream"
        });
    } finally {
        connection.release();
    }
};

export const resume_live = async (req, res) => {
    const user_id = req.user.id;
    const { stream_id } = req.params;

    if (!stream_id) {
        return res.status(400).json({
            status: 400,
            message: "stream_id is required"
        });
    }

    const connection = await mysql_db.getConnection();

    try {
        await connection.beginTransaction();

        // Verify stream belongs to user and is paused
        const [stream] = await connection.query(
            `SELECT stream_id, is_audio FROM user_streams WHERE stream_id = ? AND user_id = ? AND status = 'paused'`,
            [stream_id, user_id]
        );

        if (stream.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "Stream not found or not paused"
            });
        }

        // Update stream to resumed
        const [updateResult] = await connection.query(
            `UPDATE user_streams 
             SET status = 'live', is_paused = 0, paused_at = NULL 
             WHERE stream_id = ?`,
            [stream_id]
        );

        if (updateResult.affectedRows !== 1) {
            throw new Error("Failed to resume stream");
        }

        await connection.commit();

        // Emit socket event
        const io = getIO();
        io.emit('stream_resumed', {
            stream_id,
            user_id,
            timestamp: new Date()
        });

        res.status(200).json({
            status: 200,
            message: "Stream resumed successfully",
            data: {
                stream_id,
                is_paused: false
            }
        });

    } catch (e) {
        await connection.rollback();
        console.log("Error resuming stream:", e);
        res.status(500).json({
            status: 500,
            message: "Internal server error: Unable to resume stream"
        });
    } finally {
        connection.release();
    }
};

export const end_live = async (req, res) => {
    const user_id = req.user.id;
    const { stream_id } = req.params;

    if (!stream_id) {
        return res.status(400).json({
            status: 400,
            message: "stream_id is required"
        });
    }

    const connection = await mysql_db.getConnection();

    try {
        await connection.beginTransaction();

        // Verify stream belongs to user and is live
        const [stream] = await connection.query(
            `SELECT stream_id, is_audio FROM user_streams WHERE stream_id = ? AND user_id = ?`,
            [stream_id, user_id]
        );

        if (stream.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "Stream not found"
            });
        }

        // Update stream to ended
        const [updateResult] = await connection.query(
            `UPDATE user_streams 
             SET status = 'end', ended_at = NOW() 
             WHERE stream_id = ?`,
            [stream_id]
        );

        if (updateResult.affectedRows !== 1) {
            throw new Error("Failed to end stream");
        }

        await connection.commit();

        // Emit socket event
        const io = getIO();
        io.emit('stream_ended', {
            stream_id,
            user_id,
            timestamp: new Date()
        });

        res.status(200).json({
            status: 200,
            message: "Stream ended successfully",
            data: {
                stream_id,
                status: 'end'
            }
        });

    } catch (e) {
        await connection.rollback();
        console.log("Error ending stream:", e);
        res.status(500).json({
            status: 500,
            message: "Internal server error: Unable to end stream"
        });
    } finally {
        connection.release();
    }
};

export const get_video_lives = async (req, res) => {
    const id = req.user.id;
    try {
        const [result] = await mysql_db.query(
            ` SELECT
            u.user_id,
            u.full_name,
            COALESCE(un.username, '') AS username,
            u.profile_picture,
            ul.country,
            ul.country_code,
            COALESCE(uvl.vip_level_id, 0) AS vip_level_id,
            us.stream_id,
            us.started_at,
            0 AS current_viewers,
            0 AS total_views,
            COALESCE(ug.total_coins_earned, 0) AS total_coins_earned
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
        LEFT JOIN (
            SELECT
                receiver_id,
                SUM(total_coins) AS total_coins_earned
            FROM user_gifts
            GROUP BY receiver_id
        ) ug
            ON ug.receiver_id = u.user_id
        WHERE us.is_live = 1
        AND us.is_audio = 0
        ORDER BY
            COALESCE(uvl.vip_level_id, 0) DESC,
            us.started_at DESC;
        `);



        if (result.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "No video rooms found"
            });
        }


        const data = result.map(value => ({
            uid: value.user_id,
            full_name: value.full_name,
            channel_name: value.username,
            profile_picture: value.profile_picture,
            country: value.country,
            country_code: value.country_code,
            vip_level_id: value.vip_level_id,
            stream_id: value.stream_id,
            coins: parseFloat(value.total_coins_earned),
            total_views: parseInt(value.total_views),
            current_views: parseInt(value.current_viewers),
        }));

        return res.status(200).json({
            status: 200,
            message: "Live video rooms found",
            data: data, //this will be accessd by all users
        })
    } catch (e) {
        console.log("Error while executing get_video_lives: ", e);
        return res.status(500).json({
            status: 500,
            message: "Internal server error: " + e.message
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
            us.started_at,
            0 AS current_viewers,
            0 AS total_views,
            COALESCE(ug.total_coins_earned, 0) AS total_coins_earned
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
        LEFT JOIN (
            SELECT
                receiver_id,
                SUM(total_coins) AS total_coins_earned
            FROM user_gifts
            GROUP BY receiver_id
        ) ug
            ON ug.receiver_id = u.user_id
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

        const data = result.map(value => ({
            uid: value.user_id,
            full_name: value.full_name,
            channel_name: value.username,
            profile_picture: value.profile_picture,
            country: value.country,
            country_code: value.country_code,
            vip_level_id: value.vip_level_id,
            stream_id: value.stream_id,
            coins: parseFloat(value.total_coins_earned),
            total_views: parseInt(value.total_views),
            current_views: parseInt(value.current_viewers),
        }));

        return res.status(200).json({
            status: 200,
            message: "Live Audio rooms fetched",
            data: data // this will be accessed by all users
        });
    } catch (e) {
        console.log("Error while executing get_live_users: ", e);
        return res.status(500).json({
            status: 500,
            message: "Internal server error"
        });
    }
};

export const get_video_stream_history = async (req, res) => {
    try {
        const user_id = req.user.id;

        if (!user_id) {
            return res.status(400).json({
                status: 400,
                message: "user_id is required"
            });
        }

        const [result] = await mysql_db.query(
            `SELECT 
                us.stream_id,
                us.started_at,
                us.ended_at,
                TIMESTAMPDIFF(MINUTE, us.started_at, us.ended_at) as duration_minutes,
                us.is_audio,
                u.full_name,
                u.profile_picture,
                COALESCE(SUM(ug.total_coins), 0) as total_coins_earned,
                COALESCE(SUM(ug.quantity), 0) as total_gifts_count,
                COUNT(DISTINCT ug.sender_id) as unique_senders
             FROM user_streams us
             INNER JOIN users u ON u.user_id = us.user_id
             LEFT JOIN user_gifts ug ON ug.context_id = us.stream_id 
                AND ug.context_type = 'LIVE' 
                AND ug.receiver_id = us.user_id
             WHERE us.user_id = ? AND us.is_audio = 0 AND us.status = 'end'
             GROUP BY us.stream_id,  us.started_at, us.ended_at, us.is_audio, u.full_name, u.profile_picture
             ORDER BY us.started_at DESC`,
            [user_id]
        );

        if (result.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "No video stream history found"
            });
        }

        return res.status(200).json({
            status: 200,
            message: "Video stream history retrieved successfully",
            count: result.length,
            data: result
        });

    } catch (e) {
        console.log("Error while fetching video stream history: ", e);
        return res.status(500).json({
            status: 500,
            message: "Internal server error"
        });
    }
};

export const get_audio_stream_history = async (req, res) => {
    try {
        const user_id = req.user.id;

        if (!user_id) {
            return res.status(400).json({
                status: 400,
                message: "user_id is required"
            });
        }

        const [result] = await mysql_db.query(
            `SELECT 
                us.stream_id,
                us.started_at,
                us.ended_at,
                TIMESTAMPDIFF(MINUTE, us.started_at, us.ended_at) as duration_minutes,
                us.is_audio,
                u.full_name,
                u.profile_picture,
                COALESCE(SUM(ug.total_coins), 0) as total_coins_earned,
                COALESCE(SUM(ug.quantity), 0) as total_gifts_count,
                COUNT(DISTINCT ug.sender_id) as unique_senders
             FROM user_streams us
             INNER JOIN users u ON u.user_id = us.user_id
             LEFT JOIN user_gifts ug ON ug.context_id = us.stream_id 
                AND ug.context_type = 'LIVE' 
                AND ug.receiver_id = us.user_id
             WHERE us.user_id = ? AND us.is_audio = 1 AND us.status = 'end'
             GROUP BY us.stream_id,   us.started_at, us.ended_at, us.is_audio, u.full_name, u.profile_picture
             ORDER BY us.started_at DESC`,
            [user_id]
        );

        if (result.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "No audio stream history found"
            });
        }

        return res.status(200).json({
            status: 200,
            message: "Audio stream history retrieved successfully",
            count: result.length,
            data: result
        });

    } catch (e) {
        console.log("Error while fetching audio stream history: ", e);
        return res.status(500).json({
            status: 500,
            message: "Internal server error"
        });
    }
};

export const get_live_earnings = async (req, res) => {
    try {
        const { stream_id } = req.params;
        const user_id = req.user.id;

        if (!stream_id) {
            return res.status(400).json({
                status: 400,
                message: "stream_id is required"
            });
        }

        // Verify stream belongs to user
        const [streamVerify] = await mysql_db.query(
            `SELECT us.stream_id, us.is_audio, us.started_at, us.ended_at, us.status
             FROM user_streams us
             WHERE us.stream_id = ? AND us.user_id = ?`,
            [stream_id, user_id]
        );

        if (streamVerify.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "Stream not found or does not belong to user"
            });
        }

        const stream = streamVerify[0];

        // Get all gifts received during this live stream
        const [gifts] = await mysql_db.query(
            `SELECT 
                ug.user_gift_id,
                ug.sender_id,
                u.user_id,
                u.full_name as sender_name,
                u.profile_picture,
                COALESCE(un.username, '') as username,
                COALESCE(uvl.vip_level_id, 0) as vip_level_id,
                g.gift_name,
                g.gift_icon_url,
                ug.quantity,
                ug.total_coins,
                ug.created_at
             FROM user_gifts ug
             INNER JOIN users u ON u.user_id = ug.sender_id
             LEFT JOIN usernames un ON un.user_id = u.user_id AND un.is_active = 1
             LEFT JOIN user_vip_levels uvl ON uvl.user_id = u.user_id AND uvl.is_active = 1
             INNER JOIN gifts g ON g.gift_id = ug.gift_id
             WHERE ug.context_type = 'LIVE' 
             AND ug.context_id = ? 
             AND ug.receiver_id = ?
             ORDER BY ug.created_at DESC`,
            [stream_id, user_id]
        );

        // Calculate totals
        const totalCoins = gifts.reduce((sum, gift) => sum + gift.total_coins, 0);
        const totalGifts = gifts.reduce((sum, gift) => sum + gift.quantity, 0);
        const uniqueSenders = new Set(gifts.map(g => g.sender_id)).size;

        return res.status(200).json({
            status: 200,
            message: "Live stream earnings retrieved successfully",
            data: {
                stream_id,
                stream_type: stream.is_audio ? 'audio' : 'video',
                status: stream.status,
                started_at: stream.started_at,
                ended_at: stream.ended_at,
                earnings: {
                    total_coins: totalCoins,
                    total_gifts: totalGifts,
                    unique_senders: uniqueSenders
                },
                gifts: gifts
            }
        });

    } catch (e) {
        console.log("Error while fetching live earnings: ", e);
        return res.status(500).json({
            status: 500,
            message: "Internal server error"
        });
    }
};
