import bcrypt from "bcrypt";
import { mysql_db } from "../db_config/mysql_connect.js";
import { generateJwt, generateRefresh, buildAuthPayload } from "../utils/token.js";
import jwt from 'jsonwebtoken';
// func() for register the user 

export const check_user = async (req, res) => {
    try {
        const [rows] = await mysql_db.query(
            "SELECT user_id, firebase_uid, email FROM users WHERE firebase_uid = ?",
            [req.firebase_user.uid]
        );

        if (rows.length === 0) {
            console.log(req.firebase_user)
            return res.status(404).json({
                status: 404,
                message: "User not registered",
                data: {
                    uid: req.firebase_user.uid,
                    email: req.firebase_user.email,
                    name: req.firebase_user.name
                }
            });
        }

        const user = rows[0];
        res.status(200)
            .json({
                status: 200,
                message: "User registered",
            });

    } catch (err) {
        res.status(401).json({
            status: 401,
            message: `Invalid or expired Firebase token ${err}`
        });
    }
};


const generateUsername = (uid) => {
    if (!uid) return "user_unknown";
    return uid.slice(0, 5) + "_" + uid.slice(-4);
};

export const sign_up = async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            status: 400,
            message: "Request body is missing"
        });
    }

    const {
        firebase_uid,
        fullname,
        dob,
        gender,
        email,
        phone,
        auth_provider,
        country,
        country_code,
        state,
        state_district,
        county,
        post_code,
        languages = []
    } = req.body;

    const connection = await mysql_db.getConnection();

    try {
        await connection.beginTransaction();

        const username = generateUsername(firebase_uid);


        const [userResult] = await connection.query(
            `INSERT INTO users (
        firebase_uid,
        full_name,
        dob,
        gender,
        email,
        phone,
        auth_provider
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                firebase_uid,
                fullname,
                dob,
                gender,
                toNull(email),
                toNull(phone),
                auth_provider
            ]
        );

        const userId = userResult.insertId;

        // user_location
        await connection.query(
            `INSERT INTO user_location (
        user_id,
        country,
        country_code,
        state,
        state_district,
        county,
        post_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                toNull(country),
                toNull(country_code),
                toNull(state),
                toNull(state_district),
                toNull(county),
                toNull(post_code)
            ]
        );

        // user_roles
        await connection.query(
            `INSERT INTO user_roles (user_id, role_id) VALUES ?`,
            [[[userId, 1], [userId, 2]]]
        );

        // usernames
        await connection.query(
            `INSERT INTO usernames (user_id, username, is_active)
       VALUES (?, ?, 1)`,
            [userId, username]
        );

        // user_wallets
        await connection.query(
            `INSERT INTO user_wallets (user_id) VALUES (?)`,
            [userId]
        );

        // user_languages (only if provided)
        if (Array.isArray(languages) && languages.length > 0) {
            await connection.query(
                `INSERT IGNORE INTO user_languages (user_id, language_id) VALUES ?`,
                [languages.map(id => [userId, id])]
            );
        }

        await connection.commit();

        return res.status(201).json({
            status: 201,
            message: "User registered successfully"
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                status: 409,
                message: "User already exists"
            });
        }

        if (
            error.code ||
            error.sqlMessage ||
            error.message?.includes("Data truncated")
        ) {
            return res.status(400).json({
                status: 400,
                message: "Invalid data provided"
            });
        }

        return res.status(500).json({
            status: 500,
            message: "Internal server error"
        });

    } finally {
        connection.release();
    }
};

export const sign_in = async (req, res) => {
    try {
        const firebase_uid = req.firebase_user.uid;

        const [user_table] = await mysql_db.query(
            `SELECT 
        u.user_id,
        u.email,
        u.full_name,
        u.dob,
        u.gender,
        r.role_name,
        a.authority_name
      FROM users u
      JOIN user_roles ur ON u.user_id = ur.user_id
      JOIN roles r ON ur.role_id = r.role_id
      JOIN role_authorities ra ON r.role_id = ra.role_id
      JOIN authorities a ON ra.authority_id = a.authority_id
      WHERE u.firebase_uid = ?`,
            [firebase_uid]
        );
        if (user_table.length === 0) {
            return res.status(400).json(
                {
                    status: 400,
                    message: "Invalid user request",
                }
            );
        }
        const user = user_table[0];

        const { roles, authorities } = buildAuthPayload(user_table);

        const payload = {
            id: user.user_id,
            roles,
            authorities
        };
        const jwtToken = generateJwt(payload);
        const refreshToken = generateRefresh(payload);

        const data = {
            "id": user.user_id,
            "full_name": user.full_name,
            "email": user.email
        };

        res.status(200).header(
            'Authorization', `Bearer ${jwtToken}`
        ).header(
            'X-Refresh-Token', `Bearer ${refreshToken}`
        ).json({
            status: 200,
            message: "Login Successful",
            data: data
        });
    } catch (error) {
        if (!res.headersSent) {
            return res.status(500).json({
                status: 500,
                message: `Internal server error, ${error}`,
            });
        }
        console.error("Error in sign_in:", error);
    }
};

export const refreshToken = async (req, res) => {
    const refreshToken = req.get('X-Refresh-Token') || "";
    if (!refreshToken) {
        return res.status(401).json({
            status: 401,
            message: "Refresh token is missing"
        });
    }



    //verify the token 
    try {
        const decode = jwt.verify(refreshToken.split(" ")[1], process.env.REFRESH_SECRET);
        const payload = { id: decode.id, roles: decode.roles, authorities: decode.authorities };

        const newJwt = generateJwt(payload);

        res.status(200).header('Authorization', `Bearer ${newJwt}`).json({
            status: 200,
            message: "Token refresh success"
        });

    } catch (error) {
        return res.status(403).json({
            status: 403,
            message: "Invalid refresh token"
        });
    }
};