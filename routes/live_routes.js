// in this we will be having all the routes like, 
// creating a live, stoping and others

import express from "express";
import { get_audio_lives, get_video_lives } from "../controller/live_controller.js";
import { authorize } from "../middleware/auth_middleware.js";

const router = express.Router();

router.get('/get_audio_lives', authorize, get_audio_lives);
router.get('/get_video_lives', authorize, get_video_lives);

export default router;