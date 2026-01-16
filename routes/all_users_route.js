import express from "express";
import { get_all_user_profiles } from "../controller/get_all_user_profiles.js";
import { authorize } from "../middleware/auth_middleware.js";

const router = express.Router();

router.get('/get_all_user_profiles', authorize, get_all_user_profiles);

export default router;