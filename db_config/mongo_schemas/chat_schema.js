import mongoose from "mongoose";
import { Schema } from "mongoose";

/**
 * Chat Conversation Schema
 * Stores metadata about chat conversations between users
 */
const chatSchema = new Schema(
    {
        participants: [
            {
                type: Number,
                required: true,
            },
        ],

        status: {
            type: String,
            enum: ["pending", "accepted", "rejected", "auto_accepted", "blocked"],
            default: "pending",
        },

        requestedBy: {
            type: Number,
            required: true,
        },

        acceptedAt: {
            type: Date,
            default: null,
        },

        lastMessage: {
            type: String,
            default: "",
        },

        lastMessageAt: {
            type: Date,
            default: null,
        },

        lastMessageType: {
            type: String,
            enum: ["text", "image", "video", "file"],
            default: "text",
        },

        lastSenderId: {
            type: Number,
        },

        unreadCount: {
            type: Map,
            of: Number,
            default: new Map(), // { userId: unreadCount }
        },

        isArchived: {
            type: Boolean,
            default: false,
        },

        blockedBy: {
            type: Number,
            default: null,
        },
    },
    {
        timestamps: true,
        indexes: [
            { key: { participants: 1 } },
            { key: { lastMessageAt: -1 } },
            { key: { status: 1 } },
        ],
    }
);

/**
 * Message Schema
 * Stores individual chat messages with support for media
 */
const messageSchema = new Schema(
    {
        chatId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "chat",
            index: true,
        },

        senderId: {
            type: Number,
            required: true,
        },

        receiverId: {
            type: Number,
            required: true,
        },

        content: {
            type: String,
            default: "",
        },

        messageType: {
            type: String,
            enum: ["text", "image", "video", "file"],
            default: "text",
        },

        media: {
            url: String,
            fileId: String, // ImageKit fileId for deletion
            fileName: String,
            fileSize: Number,
            mimeType: String,
            duration: Number, // for videos
        },

        isEdited: {
            type: Boolean,
            default: false,
        },

        editedAt: {
            type: Date,
            default: null,
        },

        readBy: [
            {
                userId: {
                    type: Number,
                },
                readAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        deletedBy: [
            {
                type: Number,
            },
        ],

        replyTo: {
            type: Schema.Types.ObjectId,
            ref: "message",
            default: null,
        },

        reactions: [
            {
                userId: {
                    type: Number,
                },
                emoji: String,
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true,
        indexes: [
            { key: { chatId: 1, createdAt: -1 } },
            { key: { senderId: 1 } },
            { key: { createdAt: -1 } },
        ],
    }
);

export const ChatModel = mongoose.model("chat", chatSchema);
export const MessageModel = mongoose.model("message", messageSchema);

// Keep old exports for backward compatibility
// export const chatSchema = ChatModel;
// export const messageSchema = MessageModel;
