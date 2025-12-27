import express from "express";
import { agora_token } from "../controller/stream_token_controller.js";
import { authorize } from "../middleware/auth_middleware.js";

const router = express();

router.get('/get_stream_token', authorize, agora_token);

export default router;