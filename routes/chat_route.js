import express from "express";
import {
    getRequestedChats,
    getActiveChats,
    getChatMessagesById,
    createOrGetChat,
    acceptChatRequest,
    rejectChatRequest,
    blockUser,
    unblockUser,
    toggleArchiveChat,
    getUserChatHistory,
    getChatDetails,
    deleteChat,
    searchChatMessages,
    sendMessageToChat,
} from "../controller/chat_controller.js";
import { authorize } from "../middleware/auth_middleware.js";

const router = express.Router();

/**
 * Chat Request Management
 */
router.get("/requests", authorize, getRequestedChats);
router.get("/active", authorize, getActiveChats);
router.post("/or-create", authorize, createOrGetChat);
router.post("/:chatId/accept", authorize, acceptChatRequest);
router.post("/:chatId/reject", authorize, rejectChatRequest);

/**
 * Chat Message Operations
 */
router.get("/:chatId/messages", authorize, getChatMessagesById);
router.post("/:chatId/messages", authorize, sendMessageToChat);
router.get("/:chatId/search", authorize, searchChatMessages);

/**
 * Chat Details & Management
 */
router.get("/:chatId", authorize, getChatDetails);
router.post("/:chatId/block", authorize, blockUser);
router.post("/:chatId/unblock", authorize, unblockUser);
router.post("/:chatId/archive", authorize, toggleArchiveChat);
router.delete("/:chatId", authorize, deleteChat);

/**
 * Chat History
 */
router.get("/user/:userId/history", authorize, getUserChatHistory);

export default router;