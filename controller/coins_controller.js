import { mysql_db } from "../db_config/mysql_connect.js";

export const get_coin_balance = async (req, res) => {
    const user_id = req.user.id;

    try {
        const [coins] = await mysql_db.query(`
            select wallet_id, balance from user_wallets where user_id = ?
            `, [user_id]);

        if (coins.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "User wallet not found"
            });
        }

        const data = {
            'wallet_id': coins[0].wallet_id,
            'balance': coins[0].balance
        };

        res.status(200).json({
            status: 200,
            message: "Wallet details fetched",
            data: data
        });

    } catch (e) {
        console.log(e);
        res.status(500).json({
            status: 500,
            message: "Internal Server Error: Unable to fetch data",
        });
    }
};

export const purchase_coins = async (req, res) => {
    //used to purchase the coins where it updated data in 
    // user_wallet, coins_transactions, and coin_purchases
    const connection = await mysql_db.getConnection();
    const user_id = req.user.id;
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
            status: 400,
            message: "Request body is required"
        });
    }
    const { package_id, coins, gateway, gateway_txn_id, amount_paid, currency, status } = req.body || {};
    try {
        await connection.beginTransaction();

        const [result] = await connection.query(
            `insert into coin_purchases 
            (user_id, package_id, coins, gateway, gateway_txn_id, amount_paid, currency, status)
            values 
            (?, ?, ?, ?, ?, ?, ?, ?) ;`
            , [user_id, package_id, coins, gateway, gateway_txn_id, amount_paid, currency, status]
        );

        const [walletResult] = await connection.query(
            `UPDATE user_wallet 
        SET balance = balance + ? 
        WHERE user_id = ? 
        AND NOT EXISTS (
            SELECT 1 FROM coin_purchases 
            WHERE gateway_txn_id = ? AND credited = 1
        )`, [coins, user_id, gateway_txn_id]);

        if (walletResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(200).json({
                status: 200,
                message: "Transaction already processed."
            });
        }

        await conn.query(
            `UPDATE coin_purchases SET credited = 1, created_at = NOW() WHERE gateway_txn_id = ?`,
            [gateway_txn_id]
        );


        const [coins_balance] = (await connection).query(
            `select wallet_id, balance 
            from user_wallets 
            where user_id =?
            `, [user_id]
        );
        if (result.affectedRows !== 1 || walletResult.affectedRows !== 1) {
            throw new Error("Transaction failed");
        }
        await connection.commit();
        const data = {
            'wallet_id': coins_balance[0].wallet_id,
            'balance': coins_balance[0].balance
        };

        res.status(201).json({
            status: 201,
            message: "Coins purchased successfully",
            data: data
        });

    } catch (e) {
        await connection.rollback();
        console.log(e);
        res.status(500).json({
            status: 500,
            message: `Internal server error: Unable to reach server ${e}`
        });
    } finally {
        connection.release();
    }

};

export const get_purchase_history = async (req, res) => {
    //here we only use coin_purchases; based on user_id
    const user_id = req.user.id;

    try {
        const [purchase] = await mysql_db.query(
            `select package_id, gateway, gateway_txn_id, amount_paid, currency, status, created_at 
             from coin_purchases 
             where user_id = ?;`
            , [user_id]);

        if (purchase.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "Purchase history not found"
            });
        }

        res.status(200).json({
            status: 200,
            message: "Purchase history fetched",
            data: purchase
        });


    } catch (e) {
        console.log(e);
        res.status(500).json({
            status: 500,
            message: "Internal Server Error: Unable to fetch data",
        });
    }

};

export const get_coins_transactions = async (req, res) => {
    // only getting data from coin_transactions based on user_id, 
    const user_id = req.user.id;

    try {
        const [rows] = await mysql_db.query(
            ` select coins, transaction_type, reference_id,description, balance_after, status, created_at
              from coin_transactions 
              where user_id = ?
            `, [user_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "No transactions history found"
            });
        }

        res.status(200).json({
            status: 200,
            message: "Coins transaction history",
            data: rows[0]
        });

    } catch (e) {
        console.log(e);
        res.status(500).json({
            status: 500,
            message: "Internal server error"
        });
    }

};