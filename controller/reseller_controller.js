import { mysql_db } from "../db_config/mysql_connect.js";

/**
 * --- SELLER ENDPOINTS ---
 */

/**
 * Get reseller's own profile and inventory
 */
export const getMyResellerProfile = async (req, res) => {
    const userId = req.user.id;
    try {
        const [rows] = await mysql_db.query(
            "SELECT * FROM reseller_profiles WHERE reseller_id = ?",
            [userId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ status: 404, message: "Reseller profile not found" });
        }
        res.status(200).json({ status: 200, data: rows[0] });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

/**
 * Transfer coins from Reseller stock to User balance
 */
export const transferCoinsToUser = async (req, res) => {
    const resellerId = req.user.id;
    const { receiver_id, amount } = req.body;

    if (!receiver_id || !amount || amount <= 0) {
        return res.status(400).json({ status: 400, message: "Invalid receiver ID or amount" });
    }

    const connection = await mysql_db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Check reseller stock
        const [reseller] = await connection.query(
            "SELECT resale_balance FROM reseller_profiles WHERE reseller_id = ? FOR UPDATE",
            [resellerId]
        );

        if (!reseller.length || reseller[0].resale_balance < amount) {
            throw new Error("Insufficient resale balance");
        }

        // 2. Check receiver wallet
        const [receiver] = await connection.query(
            "SELECT balance FROM user_wallets WHERE user_id = ? FOR UPDATE",
            [receiver_id]
        );

        if (!receiver.length) {
            throw new Error("Receiver wallet not found");
        }

        const newResellerBalance = reseller[0].resale_balance - amount;
        const newReceiverBalance = receiver[0].balance + amount;

        // 3. Update Reseller Inventory
        await connection.query(
            "UPDATE reseller_profiles SET resale_balance = ? WHERE reseller_id = ?",
            [newResellerBalance, resellerId]
        );

        // 4. Update Receiver Wallet
        await connection.query(
            "UPDATE user_wallets SET balance = ? WHERE user_id = ?",
            [newReceiverBalance, receiver_id]
        );

        // 5. Log in transfers ledger
        await connection.query(
            `INSERT INTO reseller_transfers (reseller_id, receiver_id, coin_amount, reseller_balance_after, receiver_balance_after) 
             VALUES (?, ?, ?, ?, ?)`,
            [resellerId, receiver_id, amount, newResellerBalance, newReceiverBalance]
        );

        // 6. Log in general coin_transactions for audit
        await connection.query(
            `INSERT INTO coin_transactions (user_id, coins, transaction_type, balance_after, description, status) 
             VALUES (?, ?, 'RESELLER_TRANSFER', ?, ?, 'SUCCESS')`,
            [receiver_id, amount, newReceiverBalance, `Received from reseller ID: ${resellerId}`]
        );

        await connection.commit();
        res.status(200).json({
            status: 200,
            message: "Transfer successful",
            data: { new_inventory: newResellerBalance }
        });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ status: 500, message: error.message });
    } finally {
        connection.release();
    }
};

/**
 * Get history of transfers made by the reseller
 */
export const getMyTransferHistory = async (req, res) => {
    const resellerId = req.user.id;
    try {
        const [rows] = await mysql_db.query(
            `SELECT rt.*, u.full_name as receiver_name 
             FROM reseller_transfers rt 
             JOIN users u ON rt.receiver_id = u.user_id 
             WHERE rt.reseller_id = ? ORDER BY rt.created_at DESC`,
            [resellerId]
        );
        res.status(200).json({ status: 200, data: rows });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

/**
 * --- ADMIN ENDPOINTS ---
 */

/**
 * Add stock to a reseller (Bulk Sale)
 */
export const addStockToReseller = async (req, res) => {
    const { reseller_id, amount, payment_method, notes } = req.body;
    const adminId = req.user.id;

    if (!reseller_id || !amount || amount <= 0) {
        return res.status(400).json({ status: 400, message: "Invalid data" });
    }

    const connection = await mysql_db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Update reseller balance
        const [result] = await connection.query(
            "UPDATE reseller_profiles SET resale_balance = resale_balance + ? WHERE reseller_id = ?",
            [amount, reseller_id]
        );

        if (result.affectedRows === 0) throw new Error("Reseller profile not found");

        // 2. Log history
        await connection.query(
            `INSERT INTO reseller_stock_history (reseller_id, added_amount, payment_method, admin_id, notes) 
             VALUES (?, ?, ?, ?, ?)`,
            [reseller_id, amount, payment_method, adminId, notes]
        );

        await connection.commit();
        res.status(200).json({ status: 200, message: "Stock added successfully" });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ status: 500, message: error.message });
    } finally {
        connection.release();
    }
};

/**
 * Get all resellers with their current stats
 */
export const getAllResellerStats = async (req, res) => {
    try {
        const [rows] = await mysql_db.query(
            `SELECT rp.*, u.full_name, u.email,
             (SELECT COUNT(*) FROM reseller_transfers WHERE reseller_id = rp.reseller_id) as total_transfers_count,
             (SELECT SUM(coin_amount) FROM reseller_transfers WHERE reseller_id = rp.reseller_id) as total_coins_sold
             FROM reseller_profiles rp
             JOIN users u ON rp.reseller_id = u.user_id`
        );
        res.status(200).json({ status: 200, data: rows });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

/**
 * Get global resale stats (Total sold via all sellers)
 */
export const getGlobalResaleStats = async (req, res) => {
    try {
        const [rows] = await mysql_db.query(
            `SELECT 
                SUM(coin_amount) as total_global_sales, 
                COUNT(*) as total_occurrences,
                MIN(created_at) as first_sale,
                MAX(created_at) as last_sale
             FROM reseller_transfers`
        );
        res.status(200).json({ status: 200, data: rows[0] });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};
