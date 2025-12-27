import express from "express";
import { authorize } from "../middleware/auth_middleware.js";
import { get_coin_balance, purchase_coins, get_purchase_history, get_coins_transactions } from "../controller/coins_controller.js";

const router = express();

router.get('/get_coins', authorize, get_coin_balance);
router.get('/get_purchase_history', authorize, get_purchase_history);
router.get('/get_coins_transaction', authorize, get_coins_transactions);
router.post('/purchase_coins', authorize, purchase_coins);

export default router;