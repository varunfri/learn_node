import express from "express";
import { authorize } from "../middleware/auth_middleware.js";
import { languages } from "../controller/language_contoller.js";

const router = express.Router();

router.get('/languages', languages);

export default router;