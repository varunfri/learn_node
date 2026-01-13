import { locationDetail } from "../controller/location_controller.js";
import express from 'express';
import { authFirebase } from "../middleware/auth_middleware.js";


const router = express.Router();


router.get('/location', authFirebase, locationDetail);


export default router;