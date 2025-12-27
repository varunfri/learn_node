import express from "express";
import { sign_up, sign_in, refreshToken, check_user } from "../controller/auth_controller.js";
import { authFirebase } from "../middleware/auth_middleware.js";

// create a router 

const router = express.Router();


router.post('/sign_up', authFirebase, sign_up);
router.post('/sign_in', authFirebase, sign_in);
router.get('/check_user', authFirebase, check_user);

router.get('/refresh_token', refreshToken);
export default router;