import mongoose from "mongoose";
import { ChatModel, MessageModel } from "../db_config/mongo_schemas/chat_schema.js";
import { mysql_db } from "../db_config/mysql_connect.js";
import { getIO } from "../utils/init_socket.js";

/**
 * Helper to fetch user details from MySQL
 * Returns a Map of userId -> userObject
 */
const getUsersFromMySQL = async (userIds) => {
    if (!userIds || userIds.size === 0) return new Map();

    try {
        // Convert Set to Array
        const idsArray = Array.from(userIds).map(Number);
        if (idsArray.length === 0) return new Map();

        const [rows] = await mysql_db.query(
            `SELECT user_id, full_name, email, profile_picture FROM users WHERE user_id IN (?)`,
            [idsArray]
        );

        const userMap = new Map();
        rows.forEach((row) => {
            const uid = Number(row.user_id); // Ensure consistent Number type (not BigInt)
            userMap.set(uid, {
                id: uid,
                name: row.full_name,
                email: row.email,
                avatar: row.profile_picture,
            });
        });

        return userMap;
    } catch (error) {
        console.error("Error fetching users from MySQL:", error);
        return new Map();
    }
};

/**
 * Helper to enrich chat objects with user data
 */
const enrichChatsWithUserData = async (chats) => {
    if (!chats || chats.length === 0) return [];

    const userIds = new Set();
    const chatObjects = chats.map((chat) => (chat.toObject ? chat.toObject() : chat));

    chatObjects.forEach((chat) => {
        if (Array.isArray(chat.participants)) {
            chat.participants.forEach((p) => {
                if (typeof p === "number" || typeof p === "bigint") userIds.add(Number(p));
                else if (p && p.id) userIds.add(Number(p.id));
            });
        }
        if (chat.requestedBy) userIds.add(Number(chat.requestedBy));
        if (chat.lastSenderId) userIds.add(Number(chat.lastSenderId));
        if (chat.blockedBy) userIds.add(Number(chat.blockedBy));
    });

    const userMap = await getUsersFromMySQL(userIds);

    const unknownUser = { id: 0, name: "Unknown User", email: "", avatar: null };

    return chatObjects.map((chat) => {
        // Enrich participants
        chat.participants = chat.participants.map((pId) => {
            const id = Number(typeof pId === "object" ? pId.id || pId : pId);
            return userMap.get(id) || { ...unknownUser, id };
        });

        // Enrich requestedBy
        if (chat.requestedBy) {
            const rbId = Number(chat.requestedBy);
            chat.requestedBy = userMap.get(rbId) || { ...unknownUser, id: rbId };
        }

        // Enrich lastSenderId
        if (chat.lastSenderId) {
            const lsId = Number(chat.lastSenderId);
            chat.lastSenderId = userMap.get(lsId) || { ...unknownUser, id: lsId };
        }

        // Enrich blockedBy
        if (chat.blockedBy) {
            const bbId = Number(chat.blockedBy);
            chat.blockedBy = userMap.get(bbId) || { ...unknownUser, id: bbId };
        }

        return chat;
    });
};

/**
 * Helper to enrich message objects with user data
 */
const enrichMessagesWithUserData = async (messages) => {
    if (!messages || messages.length === 0) return [];

    const userIds = new Set();
    const messageObjects = messages.map((msg) => (msg.toObject ? msg.toObject() : msg));

    messageObjects.forEach((msg) => {
        if (msg.senderId) userIds.add(msg.senderId);
        if (msg.receiverId) userIds.add(msg.receiverId);
        if (msg.readBy) {
            msg.readBy.forEach((r) => {
                if (r.userId) userIds.add(r.userId);
            });
        }
        // Reactions, deletedBy, etc. could also be enriched if needed
    });

    const userMap = await getUsersFromMySQL(userIds);
    const unknownUser = { id: 0, name: "Unknown User", email: "", avatar: null };

    return messageObjects.map((msg) => {
        if (msg.senderId) {
            msg.senderId = userMap.get(msg.senderId) || { ...unknownUser, id: msg.senderId };
        }
        if (msg.receiverId) {
            msg.receiverId = userMap.get(msg.receiverId) || { ...unknownUser, id: msg.receiverId };
        }
        // You might want to enrich readBy, etc. if frontend uses it
        // For now, keeping it simple as main UI uses sender/receiver
        return msg;
    });
};

/**
 * Get chat requests (pending chats)
 * GET /chats/requests
 */
export const getRequestedChats = async (req, res) => {
    try {
        const userId = req.user.id;

        const requests = await ChatModel.find({
            participants: userId,
            status: "pending",
            requestedBy: { $ne: userId },
        })
            .sort({ createdAt: -1 })
            .limit(50);

        if (!requests || requests.length === 0) {
            return res.status(200).json({
                status: 200,
                message: "No pending chat requests",
                data: [],
            });
        }

        const enrichedRequests = await enrichChatsWithUserData(requests);

        return res.status(200).json({
            status: 200,
            message: "Chat requests fetched successfully",
            data: enrichedRequests,
        });
    } catch (error) {
        console.error("Chat request fetching error:", error);
        return res.status(500).json({
            status: 500,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Get active chats (accepted conversations)
 * GET /chats/active
 */
export const getActiveChats = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 50, page = 1 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const chats = await ChatModel.find({
            participants: userId,
            status: { $in: ["accepted", "auto_accepted"] },
        })
            .sort({ lastMessageAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const totalCount = await ChatModel.countDocuments({
            participants: userId,
            status: { $in: ["accepted", "auto_accepted"] },
        });

        if (!chats || chats.length === 0) {
            return res.status(200).json({
                status: 200,
                message: "No active chats found",
                data: [],
                pagination: {
                    total: 0,
                    page: parseInt(page),
                    limit: parseInt(limit),
                },
            });
        }

        const enrichedChats = await enrichChatsWithUserData(chats);

        return res.status(200).json({
            status: 200,
            message: "Active chats found",
            data: enrichedChats,
            pagination: {
                total: totalCount,
                page: parseInt(page),
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error("Error fetching active chats:", error);
        return res.status(500).json({
            status: 500,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Get chat messages by Chat ID
 * GET /chats/:chatId/messages
 * Query params: limit, page
 */
export const getChatMessagesById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { chatId } = req.params;
        const { limit = 50, page = 1 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Validate user has access to this chat
        const chat = await ChatModel.findOne({
            _id: chatId,
            participants: userId,
        });

        if (!chat) {
            return res.status(403).json({
                status: 403,
                message: "Access denied to this chat",
            });
        }

        // Fetch messages
        const messages = await MessageModel.find({ chatId })
            .populate("replyTo") // internal ref to message, valid in Mongo
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const totalCount = await MessageModel.countDocuments({ chatId });

        const enrichedMessages = await enrichMessagesWithUserData(messages);

        // Filter out deleted messages for this user
        const filteredMessages = enrichedMessages
            .map((msg) => {
                if (msg.deletedBy && msg.deletedBy.includes(userId)) {
                    msg.content = "[This message was deleted]";
                    msg.media = null;
                }
                return msg;
            })
            .reverse(); // Reverse to get chronological order

        return res.status(200).json({
            status: 200,
            message: `Messages loaded for chatId: ${chatId}`,
            data: filteredMessages,
            chatInfo: {
                chatId: chat._id,
                status: chat.status,
                participants: chat.participants, // Note: these are raw IDs here, usually messages endpoint doesn't return full chat info participants
            },
            pagination: {
                total: totalCount,
                page: parseInt(page),
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error("Error retrieving chat messages:", error);
        return res.status(500).json({
            status: 500,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Create or get 1-on-1 chat with another user
 * POST /chats/or-create
 * Body: { recipientId }
 */
export const createOrGetChat = async (req, res) => {
    try {
        const userId = req.user.id;
        const { recipientId } = req.body;

        if (!recipientId) {
            return res.status(400).json({
                status: 400,
                message: "Recipient ID is required",
            });
        }

        // recipientId might be string from JSON, convert to number
        const recipientIdNum = Number(recipientId);

        if (userId === recipientIdNum) {
            return res.status(400).json({
                status: 400,
                message: "Cannot create chat with yourself",
            });
        }

        // Check if chat already exists
        let chat = await ChatModel.findOne({
            participants: { $all: [userId, recipientIdNum] },
        });

        if (chat) {
            const enrichedChat = (await enrichChatsWithUserData([chat]))[0];
            return res.status(200).json({
                status: 200,
                message: "Chat already exists",
                data: enrichedChat,
            });
        }

        // Create new chat
        chat = new ChatModel({
            participants: [userId, recipientIdNum],
            status: "pending",
            requestedBy: userId,
            unreadCount: new Map(),
        });

        await chat.save();

        const enrichedChat = (await enrichChatsWithUserData([chat]))[0];

        return res.status(201).json({
            status: 201,
            message: "Chat created successfully",
            data: enrichedChat,
        });
    } catch (error) {
        console.error("Error creating chat:", error);
        return res.status(500).json({
            status: 500,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Accept chat request
 * POST /chats/:chatId/accept
 */
export const acceptChatRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { chatId } = req.params;

        const chat = await ChatModel.findOne({
            _id: chatId,
            participants: userId,
            status: "pending",
            requestedBy: { $ne: userId },
        });

        if (!chat) {
            return res.status(404).json({
                status: 404,
                message: "Chat request not found",
            });
        }

        chat.status = "accepted";
        chat.acceptedAt = new Date();
        await chat.save();

        const enrichedChat = (await enrichChatsWithUserData([chat]))[0];

        return res.status(200).json({
            status: 200,
            message: "Chat request accepted",
            data: enrichedChat,
        });
    } catch (error) {
        console.error("Error accepting chat:", error);
        return res.status(500).json({
            status: 500,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Reject chat request
 * POST /chats/:chatId/reject
 */
export const rejectChatRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { chatId } = req.params;

        const chat = await ChatModel.findOne({
            _id: chatId,
            participants: userId,
            status: "pending",
            requestedBy: { $ne: userId },
        });

        if (!chat) {
            return res.status(404).json({
                status: 404,
                message: "Chat request not found",
            });
        }

        chat.status = "rejected";
        await chat.save();

        return res.status(200).json({
            status: 200,
            message: "Chat request rejected",
        });
    } catch (error) {
        console.error("Error rejecting chat:", error);
        return res.status(500).json({
            status: 500,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Block user (prevents future chats)
 * POST /chats/:chatId/block
 */
export const blockUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const { chatId } = req.params;

        // Find chat where user is a participant
        const chat = await ChatModel.findOne({
            _id: chatId,
            participants: userId,
        });

        if (!chat) {
            return res.status(404).json({
                status: 404,
                message: "Chat not found",
            });
        }

        chat.status = "blocked";
        chat.blockedBy = userId;
        await chat.save();

        return res.status(200).json({
            status: 200,
            message: "User blocked successfully",
        });
    } catch (error) {
        console.error("Error blocking user:", error);
        return res.status(500).json({
            status: 500,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Unblock user
 * POST /chats/:chatId/unblock
 */
export const unblockUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const { chatId } = req.params;

        const chat = await ChatModel.findOne({
            _id: chatId,
            participants: userId,
            blockedBy: userId,
        });

        if (!chat) {
            return res.status(404).json({
                status: 404,
                message: "Chat not found",
            });
        }

        chat.status = "pending";
        chat.blockedBy = null;
        await chat.save();

        return res.status(200).json({
            status: 200,
            message: "User unblocked successfully",
        });
    } catch (error) {
        console.error("Error unblocking user:", error);
        return res.status(500).json({
            status: 500,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Archive/Unarchive chat
 * POST /chats/:chatId/archive
 */
export const toggleArchiveChat = async (req, res) => {
    try {
        const userId = req.user.id;
        const { chatId } = req.params;

        const chat = await ChatModel.findOne({
            _id: chatId,
            participants: userId,
        });

        if (!chat) {
            return res.status(404).json({
                status: 404,
                message: "Chat not found",
            });
        }

        chat.isArchived = !chat.isArchived;
        await chat.save();

        return res.status(200).json({
            status: 200,
            message: `Chat ${chat.isArchived ? "archived" : "unarchived"} successfully`,
            data: chat,
        });
    } catch (error) {
        console.error("Error toggling archive:", error);
        return res.status(500).json({
            status: 500,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Get chat history for a specific user
 * GET /chats/user/:userId/history
 */
export const getUserChatHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, page = 1, includeArchived = false } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build query
        const query = {
            participants: Number(userId),
        };

        if (includeArchived === "false") {
            query.isArchived = false;
        }

        // Get all chats for the user
        const chats = await ChatModel.find(query)
            .sort({ lastMessageAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const totalCount = await ChatModel.countDocuments(query);

        // Get message statistics
        const stats = await Promise.all(
            chats.map(async (chat) => {
                const msgCount = await MessageModel.countDocuments({
                    chatId: chat._id,
                });
                return {
                    chatId: chat._id,
                    messageCount: msgCount,
                };
            })
        );

        const enrichedChats = await enrichChatsWithUserData(chats);

        const chatsWithStats = enrichedChats.map((chat) => {
            const stat = stats.find((s) => s.chatId.toString() === chat._id.toString());
            return {
                ...chat,
                messageCount: stat?.messageCount || 0,
            };
        });

        return res.status(200).json({
            status: 200,
            message: "Chat history retrieved successfully",
            data: chatsWithStats,
            pagination: {
                total: totalCount,
                page: parseInt(page),
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error("Error getting chat history:", error);
        return res.status(500).json({
            status: 500,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Get chat details
 * GET /chats/:chatId
 */
export const getChatDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const { chatId } = req.params;

        const chat = await ChatModel.findOne({
            _id: chatId,
            participants: userId,
        });

        if (!chat) {
            return res.status(404).json({
                status: 404,
                message: "Chat not found",
            });
        }

        const enrichedChat = (await enrichChatsWithUserData([chat]))[0];
        const messageCount = await MessageModel.countDocuments({ chatId });

        return res.status(200).json({
            status: 200,
            message: "Chat details retrieved",
            data: {
                ...enrichedChat,
                messageCount,
            },
        });
    } catch (error) {
        console.error("Error getting chat details:", error);
        return res.status(500).json({
            status: 500,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Delete entire chat conversation
 * DELETE /chats/:chatId
 */
export const deleteChat = async (req, res) => {
    try {
        const userId = req.user.id;
        const { chatId } = req.params;

        const chat = await ChatModel.findOne({
            _id: chatId,
            participants: userId,
        });

        if (!chat) {
            return res.status(404).json({
                status: 404,
                message: "Chat not found",
            });
        }

        // Delete all messages in this chat
        await MessageModel.deleteMany({ chatId });

        // Delete the chat
        await ChatModel.deleteOne({ _id: chatId });

        return res.status(200).json({
            status: 200,
            message: "Chat deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting chat:", error);
        return res.status(500).json({
            status: 500,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Search messages in a chat
 * GET /chats/:chatId/search
 * Query params: q (search query), limit, page
 */
export const searchChatMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { chatId } = req.params;
        const { q, limit = 20, page = 1 } = req.query;

        if (!q) {
            return res.status(400).json({
                status: 400,
                message: "Search query is required",
            });
        }

        // Validate access
        const chat = await ChatModel.findOne({
            _id: chatId,
            participants: userId,
        });

        if (!chat) {
            return res.status(403).json({
                status: 403,
                message: "Access denied",
            });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const messages = await MessageModel.find({
            chatId,
            $or: [{ content: { $regex: q, $options: "i" } }, { "media.fileName": { $regex: q, $options: "i" } }],
        })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const totalCount = await MessageModel.countDocuments({
            chatId,
            $or: [{ content: { $regex: q, $options: "i" } }, { "media.fileName": { $regex: q, $options: "i" } }],
        });

        const enrichedMessages = await enrichMessagesWithUserData(messages);

        return res.status(200).json({
            status: 200,
            message: "Messages found",
            data: enrichedMessages,
            pagination: {
                total: totalCount,
                page: parseInt(page),
                limit: parseInt(limit),
            },
        });
    } catch (error) {
        console.error("Error searching messages:", error);
        return res.status(500).json({
            status: 500,
            message: "Internal server error",
            error: error.message,
        });
    }
};

/**
 * Send a message to a chat (REST endpoint)
 * POST /chats/:chatId/messages
 * Body: { content }
 */
export const sendMessageToChat = async (req, res) => {
    try {
        const userId = req.user.id;
        const { chatId } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                status: 400,
                message: "Message content cannot be empty",
            });
        }

        // Validate chat access and status
        const chat = await ChatModel.findOne({
            _id: chatId,
            participants: userId,
            status: { $in: ["accepted", "auto_accepted"] },
        });

        if (!chat) {
            return res.status(403).json({
                status: 403,
                message: "Cannot send message to this chat",
            });
        }

        // Auto-accept pending chats on first message
        if (chat.status === "pending") {
            chat.status = "auto_accepted";
            chat.acceptedAt = new Date();
        }

        // Find receiver
        const receiverId = chat.participants.find((id) => id !== userId);

        // Create message
        const newMessage = new MessageModel({
            chatId,
            senderId: userId,
            receiverId,
            content: content.trim(),
            messageType: "text",
        });

        await newMessage.save();

        // Update chat metadata
        chat.lastMessage = content.substring(0, 50);
        chat.lastMessageAt = newMessage.createdAt;
        chat.lastMessageType = "text";
        chat.lastSenderId = userId;

        // Increment unread count for receiver
        const unreadCount = chat.unreadCount.get(receiverId.toString()) || 0;
        chat.unreadCount.set(receiverId.toString(), unreadCount + 1);

        await chat.save();

        // Emit socket event so the receiver gets the message in real-time
        try {
            const io = getIO();
            const roomName = `chat_${chatId}`;
            io.to(roomName).emit("message_received", {
                messageId: newMessage._id,
                chatId,
                senderId: userId,
                receiverId,
                content: newMessage.content,
                messageType: "text",
                createdAt: newMessage.createdAt,
            });
        } catch (socketErr) {
            console.error("Socket emit error (non-fatal):", socketErr.message);
        }

        // Convert to plain object for response
        const messageObj = newMessage.toObject();

        return res.status(201).json({
            status: 201,
            message: "Message sent successfully",
            data: messageObj,
        });
    } catch (error) {
        console.error("Error sending message:", error);
        return res.status(500).json({
            status: 500,
            message: "Internal server error",
            error: error.message,
        });
    }
};
