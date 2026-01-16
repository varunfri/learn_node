// here we'll manage the gifts related db,
// getting the gifts and modifying gift related details;
import { mysql_db } from "../db_config/mysql_connect.js";

// we use gifts table here!

export const add_gift = async (req, res) => {
    const connection = await mysql_db.getConnection();
    try {
        await connection.beginTransaction();
        if (!req.body || Object.keys(req.body) === 0) {
            return res.status(400).json({
                status: 400,
                message: "Request body is required"
            });
        }
        const { gift_name, gift_icon_url, coin_cost } = req.body || {};

        if (!gift_name || !gift_icon_url || !coin_cost) {
            return res.status(400).json({
                status: 400,
                message: "Gift details are missing"
            });
        }

        const [result] = await connection.query(
            `insert into
            gifts(gift_name, gift_icon_url, coin_cost)
            values (?, ?, ?);
        `, [gift_name, gift_icon_url, coin_cost]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(500).json({
                status: 500,
                message: "Internal server error: Unable to add gift"
            });
        }

        await connection.commit();

        const id = result.insertId;

        return res.status(200).json({
            status: 200,
            message: "Gift added successfully",

        });
    } catch (e) {
        await connection.rollback();
        console.log(e);
        return res.status(500).json({
            status: 500,
            message: "internal server error"
        });
    } finally {
        connection.release();
    }
};

export const enable_gift = async (req, res) => {
    try {
        const gift_id = req.params.id;

        if (!gift_id) {
            return res.status(400).json({
                status: 400,
                message: "Gift id is required"
            });
        }

        const [result] = await mysql_db.query(
            `update gifts 
            set is_active = 1 
            where gift_id =?;
            `,
            [gift_id]
        );

        if (result.affectedRows === 0) {
            return res.status(500).json({
                status: 500,
                message: "Gift not found"
            });
        }

        return res.status(200).json({
            status: 200,
            message: "Gift enabled successfully"
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            status: 500,
            message: "Internal server error"
        });
    }

};

export const disable_gift = async (req, res) => {
    try {
        const gift_id = req.params.id;

        if (!gift_id) {
            return res.status(400).json({
                status: 400,
                message: "Gift id is required"
            });
        }

        const [result] = await mysql_db.query(
            `update gifts 
            set is_active = 0 
            where gift_id =?;
            `,
            [gift_id]
        );

        if (result.affectedRows === 0) {
            return res.status(500).json({
                status: 500,
                message: "Gift not found"
            });
        }

        return res.status(200).json({
            status: 200,
            message: "Gift disabled successfully"
        });

    } catch (e) {
        console.log(e);
        return res.status(500).json({
            status: 500,
            message: "Internal server error"
        });
    }
};


export const is_gift_animate = async (req, res) => {
    try {
        const gift_id = req.params.id;

        const [result] = await mysql_db.query(
            `update gifts 
            set is_animated = 1
            where gift_id = ?`,
            [gift_id]
        );

        if (result.affectedRows === 0) {
            return res.status(500).json({
                status: 500,
                message: `No gift found with gift_id ${gift_id}`
            });
        }

        return res.status(200).json({
            status: 200,
            message: `Gift details updated for gift id: ${gift_id}`
        });
    } catch (e) {
        console.log(e);
        return res.status(500).json({
            status: 500,
            message: "Internal server error"
        });
    }
};

export const delete_gift = async (req, res) => {
    try {
        const gift_id = req.params.id;

        if (!gift_id) {
            return res.status(400).json({
                status: 400,
                message: "Gift id is required",
            });
        }

        const [result] = await mysql_db.query(
            `DELETE FROM gifts WHERE gift_id = ?`,
            [gift_id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 404,
                message: "Gift not found",
            });
        }
        return res.status(200).json({
            status: 200,
            message: "Gift deleted successfully",
        });

    } catch (e) {
        console.log(e);
        return res.status(500).json({
            status: 500,
            message: "Internal server error"
        });
    }

};

export const get_gifts = async (req, res) => {
    try {
        const [result] = await mysql_db.query(
            `select gift_id, gift_name, gift_icon_url, coin_cost,
            is_active, is_animated
            from gifts;`
        );

        if (result.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "No gifts found"
            });
        }

        return res.status(200).json({
            status: 200,
            message: "Gifts fetched successfully",
            data: result
        });

    } catch (e) {
        console.log(e);
        return res.status(500).json({
            status: 500,
            message: "Internal server error"
        });
    }
};

export const update_gift = async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                status: 400,
                message: "Request body is required"
            });
        }

        const { gift_id, gift_name, gift_icon_url, coin_cost } = req.body || {};

        if (!gift_id) {
            return res.status(400).json({
                status: 400,
                message: "gift_id is required",
            });
        }

        const [result] = await mysql_db.query(
            `UPDATE gifts
            SET gift_name = ?, gift_icon_url = ?, coin_cost = ?
            WHERE gift_id = ?`,
            [gift_name, gift_icon_url, coin_cost, gift_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 404,
                message: "Gift not found",
            });
        }

        return res.status(200).json({
            status: 200,
            message: "Gift details updated successfully",
        });


    } catch (e) {
        console.log(e);
        return res.status(500).json({
            status: 500,
            message: "Internal server error"
        });
    }

};

export const add_bulk_gift = async (req, res) => {
    const connection = await mysql_db.getConnection();
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                status: 400,
                message: "Request body is missing"
            });
        }
        await connection.beginTransaction();
        const { gifts } = req.body;
        for (const gift of gifts) {
            if (!gift.gift_name || !gift.coin_cost || !gift.gift_icon_url) {
                return res.status(400).json({
                    status: 400,
                    message: "Invalid gift data"
                });
            }
        }

        const values = gifts.map(g => [
            g.gift_name,
            g.gift_icon_url,
            g.coin_cost
        ]);

        const [result] = await connection.query(
            `INSERT INTO gifts (gift_name, gift_icon_url, coin_cost) VALUES ?`,
            [values]
        );
        await connection.commit();

        return res.status(200).json({
            status: 200,
            message: `Inserted ${result.affectedRows} gifts`

        });

    } catch (e) {
        await connection.rollback();
        console.log(e);
        return res.status(500).json({
            status: 500,
            message: "Internal server error"
        });
    } finally {
        connection.release();
    }
};



// we only use this for users's && we use user_gifts table here
export const user_send_gifts = async (req, res) => {
    try { } catch (e) { }
};