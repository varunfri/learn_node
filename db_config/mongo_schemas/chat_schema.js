import mongoose from "mongoose";
import { Schema } from "mongoose";

const counterSchema = new Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});

const Counter = mongoose.model("Counter", counterSchema);

const getNextId = async (name) => {
    const counter = await Counter.findByIdAndUpdate(
        name,
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return counter.seq;
};

/**
 * Chat Conversation Schema
 * Stores metadata about chat conversations between users
 */
const chatSchema = new Schema(
    {
        _id: { type: Number },

        participants: [
            {
                type: Number,
                ref: "User",
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
            ref: "User",
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
            ref: "User",
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
            ref: "User",
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

chatSchema.pre("save", async function () {
    if (this.isNew && !this._id) {
        this._id = await getNextId("chatId");
    }
});

/**
 * Message Schema
 * Stores individual chat messages with support for media
 */
const messageSchema = new Schema(
    {
        _id: { type: Number },

        chatId: {
            type: Number,
            required: true,
            ref: "chat",
            index: true,
        },

        senderId: {
            type: Number,
            required: true,
            ref: "User",
        },

        receiverId: {
            type: Number,
            required: true,
            ref: "User",
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
                    ref: "User",
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
                ref: "User",
            },
        ],

        replyTo: {
            type: Number,
            ref: "message",
            default: null,
        },

        reactions: [
            {
                userId: {
                    type: Number,
                    ref: "User",
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

messageSchema.pre("save", async function () {
    if (this.isNew && !this._id) {
        this._id = await getNextId("messageId");
    }
});

/**
 * User Schema (Minimal for MongoDB to support populate)
 * The main user data is in MySQL, this stores a copy for chat performance
 */
const userSchema = new Schema(
    {
        _id: { type: Number },
        name: { type: String, required: true },
        avatar: { type: String },
        email: { type: String },
    },
    { timestamps: true }
);

export const UserModel = mongoose.model("User", userSchema);
export const ChatModel = mongoose.model("chat", chatSchema);
export const MessageModel = mongoose.model("message", messageSchema);
export const CounterModel = Counter;
