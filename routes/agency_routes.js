import express from "express";
import {
    createAgency,
    getAllAgencies,
    getAgencyById,
    updateAgency,
    sendJoinRequest,
    respondToJoinRequest,
    getAgencyMembers,
    getAgencyEarnings,
    getAgencyStats,
    generateInviteCode,
    joinWithInviteCode
} from "../controller/agency_controller.js";
import { authorize } from "../middleware/auth_middleware.js";

const router = express.Router();

// Public/Authenticated routes
router.get("/all", getAllAgencies);
router.get("/:id", getAgencyById);

// Protected routes (require login)
router.use(authorize);

router.post("/create", createAgency);
router.put("/:id/update", updateAgency);
router.get("/:id/members", getAgencyMembers);
router.get("/:id/earnings", getAgencyEarnings);
router.get("/:id/stats", getAgencyStats);

// Recruitment/Joining
router.post("/request/send", sendJoinRequest);
router.post("/request/:requestId/respond", respondToJoinRequest);

// Referral Code routes
router.post("/invite/generate", generateInviteCode);
router.post("/invite/join", joinWithInviteCode);

export default router;
