import { mysql_db } from "../db_config/mysql_connect.js";

export const languages = async (req, res) => {
    const [rows] = await mysql_db.query(
        ` select * from languages order by language_id;`
    );

    if (rows.length === 0) {
        return res.status(401).json({
            status: 401,
            message: "Invalid user request"
        });
    }
    const data = rows.reduce((acc, row) => {
        acc.push({
            id: row.language_id,
            language: row.language_name,
        });
        return acc;
    }, []);


    console.log(data);

    res.status(200).json(
        {
            status: 200,
            message: "Languages fetched",
            data: data
        }
    );
};


export const updateUserLanguages = async (req, res) => {
    const userId = req.user.id;


    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            status: 400,
            message: "Request body is required"
        });
    }
    const { languages } = req.body || {};

    const connection = await mysql_db.getConnection();
    try {
        (await connection).beginTransaction();

        (await connection).query(
            'delete from user_languages where user_id = ?',
            [userId]
        );

        if (Array.isArray(languages) && languages.length > 0) {
            await connection.query(
                `INSERT INTO user_languages (user_id, language_id) VALUES ?`,
                [languages.map(lang_id => [userId, lang_id])]
            );
        }

        (await connection).commit();

        res.status(200).json({
            status: 200,
            message: "Languages updated successfully"
        });


    } catch (e) {
        (await connection).rollback();

        console.log(e);
        res.status(500).json({
            status: 500,
            message: "Failed to update languages"
        });
    }


};