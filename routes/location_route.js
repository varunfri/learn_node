import { locationDetail } from "../controller/location_controller.js";
import express from 'express';
import { authFirebase } from "../middleware/auth_middleware.js";


const router = express.Router();


router.get('/location/:ip', authFirebase, locationDetail);
// router.get('/location/:ip', authFirebase, getLocationFromIP);

export default router;