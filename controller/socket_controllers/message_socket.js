import { ChatModel, MessageModel } from "../../db_config/mongo_schemas/chat_schema.js";

/**
 * Real-time messaging socket handlers
 * Handles chat message events, notifications, and read receipts
 */
export const messageSocketHandlers = (io, socket) => {
    const userId = socket.user.id;

    /**
     * Join chat room
     * Allows user to receive real-time messages for specific chat
     * Emitted by: Client joining a chat conversation
     * Data: { chatId }
     */
    socket.on("join_chat", async ({ chatId }) => {
        try {
            // Validate chat access
            const chat = await ChatModel.findOne({
                _id: chatId,
                participants: userId,
            });

            if (!chat) {
                socket.emit("error", { message: "Access denied to this chat" });
                return;
            }

            const roomName = `chat_${chatId}`;
            socket.join(roomName);

            // Reset unread count for this user
            chat.unreadCount.set(userId.toString(), 0);
            await chat.save();

            socket.emit("join_chat_success", {
                chatId,
                message: "Joined chat room",
            });

            // Notify other participants that user is online
            socket.to(roomName).emit("user_online", {
                userId,
                chatId,
                timestamp: new Date(),
            });
        } catch (error) {
            console.error("Error joining chat:", error);
            socket.emit("error", { message: "Failed to join chat" });
        }
    });

    /**
     * Leave chat room
     * Emitted by: Client leaving a chat conversation
     * Data: { chatId }
     */
    socket.on("leave_chat", ({ chatId }) => {
        try {
            const roomName = `chat_${chatId}`;
            socket.leave(roomName);

            socket.to(roomName).emit("user_offline", {
                userId,
                chatId,
                timestamp: new Date(),
            });

            socket.emit("leave_chat_success", { chatId });
        } catch (error) {
            console.error("Error leaving chat:", error);
            socket.emit("error", { message: "Failed to leave chat" });
        }
    });

    /**
     * Send text message
     * Emitted by: Client sending a message
     * Data: { chatId, content, replyToId (optional) }
     */
    socket.on("send_message", async ({ chatId, content, replyToId }) => {
        try {
            if (!content || !content.trim()) {
                socket.emit("error", { message: "Message content cannot be empty" });
                return;
            }

            // Validate chat access
            const chat = await ChatModel.findOne({
                _id: chatId,
                participants: userId,
                status: { $in: ["accepted", "auto_accepted", "pending"] },
            });

            if (!chat) {
                socket.emit("error", { message: "Cannot send message to this chat" });
                return;
            }

            // Find receiver
            const receiverId = chat.participants.find((id) => id.toString() !== userId.toString());

            // Create message
            const newMessage = new MessageModel({
                chatId,
                senderId: userId,
                receiverId,
                content: content.trim(),
                messageType: "text",
                replyTo: replyToId || null,
            });

            await newMessage.save();

            // Auto-accept pending chats on first message
            if (chat.status === "pending") {
                chat.status = "auto_accepted";
                chat.acceptedAt = new Date();
            }

            // Update chat metadata
            chat.lastMessage = content.substring(0, 50);
            chat.lastMessageAt = newMessage.createdAt;
            chat.lastMessageType = "text";
            chat.lastSenderId = userId;

            // Increment unread count for receiver
            const unreadCount = chat.unreadCount.get(receiverId.toString()) || 0;
            chat.unreadCount.set(receiverId.toString(), unreadCount + 1);

            await chat.save();

            // Emit to chat room
            const roomName = `chat_${chatId}`;
            io.to(roomName).emit("message_received", {
                messageId: newMessage._id,
                chatId,
                senderId: userId,
                receiverId,
                content: newMessage.content,
                messageType: "text",
                createdAt: newMessage.createdAt,
                replyTo: newMessage.replyTo,
            });

            // Notify receiver about unread message
            io.to(`user_${receiverId}`).emit("unread_message", {
                chatId,
                unreadCount: chat.unreadCount.get(receiverId.toString()),
                lastMessage: newMessage.content,
                senderId: userId,
            });

            socket.emit("send_message_success", {
                messageId: newMessage._id,
                timestamp: newMessage.createdAt,
            });
        } catch (error) {
            console.error("Error sending message:", error);
            socket.emit("error", { message: "Failed to send message" });
        }
    });

    /**
     * Send media message (image/video)
     * Emitted by: Client sending media
     * Data: { chatId, media: { url, fileId, fileName, fileSize, mimeType }, messageType, replyToId (optional) }
     */
    socket.on("send_media", async ({ chatId, media, messageType, replyToId }) => {
        try {
            if (!media || !media.url) {
                socket.emit("error", { message: "Media URL is required" });
                return;
            }

            // Validate chat access
            const chat = await ChatModel.findOne({
                _id: chatId,
                participants: userId,
                status: { $in: ["accepted", "auto_accepted", "pending"] },
            });

            if (!chat) {
                socket.emit("error", { message: "Cannot send message to this chat" });
                return;
            }

            const receiverId = chat.participants.find((id) => id.toString() !== userId.toString());

            // Create message with media
            const newMessage = new MessageModel({
                chatId,
                senderId: userId,
                receiverId,
                messageType,
                media: {
                    url: media.url,
                    fileId: media.fileId,
                    fileName: media.fileName,
                    fileSize: media.fileSize,
                    mimeType: media.mimeType,
                    duration: media.duration,
                },
                replyTo: replyToId || null,
            });

            await newMessage.save();

            // Update chat metadata
            chat.lastMessage = `[${messageType.toUpperCase()}]`;
            chat.lastMessageAt = newMessage.createdAt;
            chat.lastMessageType = messageType;
            chat.lastSenderId = userId;

            // Increment unread count
            const unreadCount = chat.unreadCount.get(receiverId.toString()) || 0;
            chat.unreadCount.set(receiverId.toString(), unreadCount + 1);

            await chat.save();

            // Emit to chat room
            const roomName = `chat_${chatId}`;
            io.to(roomName).emit("media_received", {
                messageId: newMessage._id,
                chatId,
                senderId: userId,
                receiverId,
                messageType,
                media: newMessage.media,
                createdAt: newMessage.createdAt,
                replyTo: newMessage.replyTo,
            });

            // Notify receiver
            io.to(`user_${receiverId}`).emit("unread_message", {
                chatId,
                unreadCount: chat.unreadCount.get(receiverId.toString()),
                lastMessage: `[${messageType.toUpperCase()}]`,
                senderId: userId,
            });

            socket.emit("send_media_success", {
                messageId: newMessage._id,
                timestamp: newMessage.createdAt,
            });
        } catch (error) {
            console.error("Error sending media:", error);
            socket.emit("error", { message: "Failed to send media" });
        }
    });

    /**
     * Mark message as read
     * Emitted by: Client reading a message
     * Data: { messageIds: [array], chatId }
     */
    socket.on("mark_as_read", async ({ messageIds, chatId }) => {
        try {
            if (!Array.isArray(messageIds) || messageIds.length === 0) {
                return;
            }

            // Update read status for messages
            await MessageModel.updateMany(
                { _id: { $in: messageIds } },
                {
                    $push: {
                        readBy: {
                            userId,
                            readAt: new Date(),
                        },
                    },
                }
            );

            // Reset unread count
            const chat = await ChatModel.findById(chatId);
            if (chat) {
                chat.unreadCount.set(userId.toString(), 0);
                await chat.save();
            }

            // Emit read receipt to room
            const roomName = `chat_${chatId}`;
            io.to(roomName).emit("messages_read", {
                messageIds,
                readBy: userId,
                chatId,
                timestamp: new Date(),
            });

            socket.emit("read_success", { messageIds });
        } catch (error) {
            console.error("Error marking messages as read:", error);
            socket.emit("error", { message: "Failed to mark messages as read" });
        }
    });

    /**
     * Typing indicator
     * Emitted by: Client typing a message
     * Data: { chatId }
     */
    socket.on("typing", ({ chatId }) => {
        try {
            const roomName = `chat_${chatId}`;
            socket.to(roomName).emit("user_typing", {
                userId,
                chatId,
                timestamp: new Date(),
            });
        } catch (error) {
            console.error("Error in typing event:", error);
        }
    });

    /**
     * Stop typing
     * Emitted by: Client stopped typing
     * Data: { chatId }
     */
    socket.on("stop_typing", ({ chatId }) => {
        try {
            const roomName = `chat_${chatId}`;
            socket.to(roomName).emit("user_stop_typing", {
                userId,
                chatId,
                timestamp: new Date(),
            });
        } catch (error) {
            console.error("Error in stop typing event:", error);
        }
    });

    /**
     * Edit message
     * Emitted by: Client editing a message
     * Data: { messageId, chatId, newContent }
     */
    socket.on("edit_message", async ({ messageId, chatId, newContent }) => {
        try {
            if (!newContent || !newContent.trim()) {
                socket.emit("error", { message: "New content cannot be empty" });
                return;
            }

            const message = await MessageModel.findById(messageId);
            if (!message || message.senderId.toString() !== userId.toString()) {
                socket.emit("error", { message: "Cannot edit this message" });
                return;
            }

            message.content = newContent.trim();
            message.isEdited = true;
            message.editedAt = new Date();
            await message.save();

            // Emit to room
            const roomName = `chat_${chatId}`;
            io.to(roomName).emit("message_edited", {
                messageId,
                chatId,
                newContent: message.content,
                editedAt: message.editedAt,
                editedBy: userId,
            });

            socket.emit("edit_success", { messageId });
        } catch (error) {
            console.error("Error editing message:", error);
            socket.emit("error", { message: "Failed to edit message" });
        }
    });

    /**
     * Delete message
     * Emitted by: Client deleting a message
     * Data: { messageId, chatId }
     */
    socket.on("delete_message", async ({ messageId, chatId }) => {
        try {
            const message = await MessageModel.findById(messageId);
            if (!message || message.senderId.toString() !== userId.toString()) {
                socket.emit("error", { message: "Cannot delete this message" });
                return;
            }

            // Add user to deletedBy
            if (!message.deletedBy.includes(userId)) {
                message.deletedBy.push(userId);
                await message.save();
            }

            // Emit to room
            const roomName = `chat_${chatId}`;
            io.to(roomName).emit("message_deleted", {
                messageId,
                chatId,
                deletedBy: userId,
            });

            socket.emit("delete_success", { messageId });
        } catch (error) {
            console.error("Error deleting message:", error);
            socket.emit("error", { message: "Failed to delete message" });
        }
    });

    /**
     * Add reaction to message
     * Emitted by: Client reacting to a message
     * Data: { messageId, chatId, emoji }
     */
    socket.on("add_reaction", async ({ messageId, chatId, emoji }) => {
        try {
            const message = await MessageModel.findById(messageId);
            if (!message) {
                socket.emit("error", { message: "Message not found" });
                return;
            }

            // Check if user already reacted with this emoji
            const existingReaction = message.reactions.find(
                (r) => r.userId.toString() === userId.toString() && r.emoji === emoji
            );

            if (!existingReaction) {
                message.reactions.push({
                    userId,
                    emoji,
                    createdAt: new Date(),
                });
                await message.save();
            }

            // Emit to room
            const roomName = `chat_${chatId}`;
            io.to(roomName).emit("reaction_added", {
                messageId,
                chatId,
                userId,
                emoji,
                timestamp: new Date(),
            });

            socket.emit("reaction_success", { messageId, emoji });
        } catch (error) {
            console.error("Error adding reaction:", error);
            socket.emit("error", { message: "Failed to add reaction" });
        }
    });

    /**
     * Remove reaction from message
     * Emitted by: Client removing a reaction
     * Data: { messageId, chatId, emoji }
     */
    socket.on("remove_reaction", async ({ messageId, chatId, emoji }) => {
        try {
            const message = await MessageModel.findById(messageId);
            if (!message) {
                socket.emit("error", { message: "Message not found" });
                return;
            }

            message.reactions = message.reactions.filter(
                (r) => !(r.userId.toString() === userId.toString() && r.emoji === emoji)
            );
            await message.save();

            // Emit to room
            const roomName = `chat_${chatId}`;
            io.to(roomName).emit("reaction_removed", {
                messageId,
                chatId,
                userId,
                emoji,
                timestamp: new Date(),
            });

            socket.emit("reaction_removed_success", { messageId, emoji });
        } catch (error) {
            console.error("Error removing reaction:", error);
            socket.emit("error", { message: "Failed to remove reaction" });
        }
    });

    /**
     * Handle socket disconnection
     */
    // socket.on("disconnect", () => {
    //     console.log(`User ${userId} disconnected from messaging`);
    // });
};

// Keep old export for backward compatibility
export const chatRequestHandlers = messageSocketHandlers;
