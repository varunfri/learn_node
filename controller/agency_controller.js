import { mysql_db } from "../db_config/mysql_connect.js";

/**
 * Create a new agency
 */
export const createAgency = async (req, res) => {
    const { name, logo_url, description, contact_phone, official_email, commission_percentage } = req.body;
    const owner_id = req.user.id;

    try {
        const [result] = await mysql_db.query(
            `INSERT INTO agencies (owner_id, name, logo_url, description, contact_phone, official_email, commission_percentage, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
            [owner_id, name, logo_url, description, contact_phone, official_email, commission_percentage || 10.00]
        );

        res.status(201).json({
            status: 201,
            message: "Agency created successfully and is pending approval",
            data: { agency_id: result.insertId }
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

/**
 * Get all active agencies
 */
export const getAllAgencies = async (req, res) => {
    try {
        const [rows] = await mysql_db.query(
            `SELECT a.*, u.full_name as owner_name 
             FROM agencies a 
             JOIN users u ON a.owner_id = u.user_id 
             WHERE a.status = 'ACTIVE'`
        );
        res.status(200).json({ status: 200, data: rows });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

/**
 * Get agency details by ID
 */
export const getAgencyById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await mysql_db.query(
            `SELECT a.*, u.full_name as owner_name 
             FROM agencies a 
             JOIN users u ON a.owner_id = u.user_id 
             WHERE a.agency_id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ status: 404, message: "Agency not found" });
        }

        res.status(200).json({ status: 200, data: rows[0] });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

/**
 * Update agency details
 */
export const updateAgency = async (req, res) => {
    const { id } = req.params;
    const { name, logo_url, description, contact_phone, official_email, commission_percentage } = req.body;
    const userId = req.user.id;

    try {
        // Check ownership
        const [agency] = await mysql_db.query("SELECT owner_id FROM agencies WHERE agency_id = ?", [id]);
        if (agency.length === 0) return res.status(404).json({ status: 404, message: "Agency not found" });

        if (agency[0].owner_id !== userId && !req.user.roles.includes('ADMIN')) {
            return res.status(403).json({ status: 403, message: "Unauthorized" });
        }

        await mysql_db.query(
            `UPDATE agencies SET name = ?, logo_url = ?, description = ?, contact_phone = ?, official_email = ?, commission_percentage = ? 
             WHERE agency_id = ?`,
            [name, logo_url, description, contact_phone, official_email, commission_percentage, id]
        );

        res.status(200).json({ status: 200, message: "Agency updated successfully" });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

/**
 * Send recruitment or join request
 */
export const sendJoinRequest = async (req, res) => {
    const { agency_id, user_id, sender_type, message } = req.body;

    try {
        const [result] = await mysql_db.query(
            `INSERT INTO agency_join_requests (agency_id, user_id, sender_type, message, status) 
             VALUES (?, ?, ?, ?, 'PENDING')`,
            [agency_id, user_id, sender_type, message]
        );
        res.status(201).json({ status: 201, message: "Request sent successfully", request_id: result.insertId });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

/**
 * Respond to join request
 */
export const respondToJoinRequest = async (req, res) => {
    const { requestId } = req.params;
    const { status } = req.body; // 'ACCEPTED' or 'REJECTED'

    const connection = await mysql_db.getConnection();
    try {
        await connection.beginTransaction();

        const [request] = await connection.query("SELECT * FROM agency_join_requests WHERE request_id = ?", [requestId]);
        if (request.length === 0) throw new Error("Request not found");

        await connection.query(
            "UPDATE agency_join_requests SET status = ?, responded_at = CURRENT_TIMESTAMP WHERE request_id = ?",
            [status, requestId]
        );

        if (status === 'ACCEPTED') {
            await connection.query(
                "INSERT INTO agency_members (agency_id, user_id, membership_status) VALUES (?, ?, 'ACTIVE')",
                [request[0].agency_id, request[0].user_id]
            );
        }

        await connection.commit();
        res.status(200).json({ status: 200, message: `Request ${status.toLowerCase()} successfully` });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ status: 500, message: error.message });
    } finally {
        connection.release();
    }
};

/**
 * Get agency members
 */
export const getAgencyMembers = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await mysql_db.query(
            `SELECT am.*, u.full_name, u.profile_picture 
             FROM agency_members am 
             JOIN users u ON am.user_id = u.user_id 
             WHERE am.agency_id = ? AND am.membership_status = 'ACTIVE'`,
            [id]
        );
        res.status(200).json({ status: 200, data: rows });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

/**
 * Get agency earnings (Auditing)
 */
export const getAgencyEarnings = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await mysql_db.query(
            `SELECT ae.*, u.full_name as streamer_name 
             FROM agency_earnings ae 
             JOIN users u ON ae.streamer_id = u.user_id 
             WHERE ae.agency_id = ? ORDER BY ae.created_at DESC`,
            [id]
        );
        res.status(200).json({ status: 200, data: rows });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

/**
 * Get agency daily stats
 */
export const getAgencyStats = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await mysql_db.query(
            "SELECT * FROM agency_stats_daily WHERE agency_id = ? ORDER BY target_date DESC LIMIT 30",
            [id]
        );
        res.status(200).json({ status: 200, data: rows });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

/**
 * Generate a referral code for an agency
 */
export const generateInviteCode = async (req, res) => {
    const { days_valid, max_uses } = req.body;
    const owner_id = req.user.id;

    try {
        // Find agency owned by this user
        const [agency] = await mysql_db.query("SELECT agency_id FROM agencies WHERE owner_id = ?", [owner_id]);
        if (agency.length === 0) return res.status(404).json({ status: 404, message: "You don't own an agency" });

        const agency_id = agency[0].agency_id;
        const code = Math.random().toString(36).substring(2, 10).toUpperCase(); // 8 char code
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + (days_valid || 7));

        await mysql_db.query(
            `INSERT INTO agency_invitations (agency_id, invitation_code, expires_at, max_uses) 
             VALUES (?, ?, ?, ?)`,
            [agency_id, code, expiry, max_uses || 1]
        );

        res.status(201).json({
            status: 201,
            message: "Referral code generated",
            data: { code, expires_at: expiry }
        });
    } catch (error) {
        res.status(500).json({ status: 500, message: error.message });
    }
};

/**
 * Join an agency using a referral code
 */
export const joinWithInviteCode = async (req, res) => {
    const { code } = req.body;
    const user_id = req.user.id;

    const connection = await mysql_db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Check if user is already in an agency
        const [existing] = await connection.query(
            "SELECT * FROM agency_members WHERE user_id = ? AND membership_status = 'ACTIVE'",
            [user_id]
        );
        if (existing.length > 0) throw new Error("You are already a member of an agency");

        // 2. Validate code (existence, expiry, usage count)
        const [invite] = await connection.query(
            `SELECT * FROM agency_invitations 
             WHERE invitation_code = ? AND expires_at > CURRENT_TIMESTAMP AND uses_count < max_uses FOR UPDATE`,
            [code]
        );

        if (invite.length === 0) throw new Error("Invalid, expired, or fully used referral code");

        const agency_id = invite[0].agency_id;

        // 3. Create membership
        await connection.query(
            "INSERT INTO agency_members (agency_id, user_id, membership_status) VALUES (?, ?, 'ACTIVE')",
            [agency_id, user_id]
        );

        // 4. Update code usage
        await connection.query(
            "UPDATE agency_invitations SET uses_count = uses_count + 1 WHERE invitation_id = ?",
            [invite[0].invitation_id]
        );

        await connection.commit();
        res.status(200).json({ status: 200, message: "Successfully joined the agency" });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ status: 400, message: error.message });
    } finally {
        connection.release();
    }
};
