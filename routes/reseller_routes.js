import express from "express";
import {
    getMyResellerProfile,
    transferCoinsToUser,
    getMyTransferHistory,
    addStockToReseller,
    getAllResellerStats,
    getGlobalResaleStats
} from "../controller/reseller_controller.js";
import { authorize, authority } from "../middleware/auth_middleware.js";

const router = express.Router();

// All reseller routes require authentication
router.use(authorize);

// --- Seller Specific Routes ---
router.get("/profile", getMyResellerProfile);
router.post("/transfer", transferCoinsToUser);
router.get("/history", getMyTransferHistory);

// --- Admin Only Routes ---
// Note: 'ADMIN' role check integrated using the authority middleware
router.post("/admin/add-stock", authority('ADMIN'), addStockToReseller);
router.get("/admin/stats", authority('ADMIN'), getAllResellerStats);
router.get("/admin/global-stats", authority('ADMIN'), getGlobalResaleStats);

export default router;
