import { mysql_db } from "../db_config/mysql_connect.js";
import { buildAuthPayload } from "../utils/token.js";

export const profile = async (req, res) => {
    try {
        //req.user is assigned in middleware using the reference of jwt token
        const userId = req.user.id;
        const [rows] = await mysql_db.query(
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
      WHERE u.user_id = ?`,
            [userId]
        );

        const { roles, authorities } = buildAuthPayload(rows);

        if (!rows.length) {
            return res.status(404).json({
                status: 404,
                message: "User not found"
            });
        }
        const user = rows[0];

        const user_data = {
            "id": user.user_id,
            "full_name": user.full_name,
            "dob": user.dob,
            "email": user.email,
            "gender": user.gender,
        };

        res.status(200).json(
            {
                status: 200,
                message: "Profile fetched successful",
                data: { user_data, roles, authorities }
            },
        );


    } catch (error) {
        res.status(500).json({
            status: 500,
            message: `Internal server error ${error}`
        });
    }
};