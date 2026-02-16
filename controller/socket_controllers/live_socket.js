import { mysql_db } from "../../db_config/mysql_connect.js";
// NO IMPORTS from server.js to avoid circular dependency

export const liveStreamHandlers = (io, socket, onlineUsers) => {

    // Helper to get sockets regardless of string/int type mismatch
    const getSocketsForUser = (userId) => {
        if (!onlineUsers) return null;
        // Try exact match
        if (onlineUsers.has(userId)) return onlineUsers.get(userId);

        // Try number casting
        const numId = Number(userId);
        if (!isNaN(numId) && onlineUsers.has(numId)) return onlineUsers.get(numId);

        // Try string casting
        const strId = String(userId);
        if (onlineUsers.has(strId)) return onlineUsers.get(strId);

        return null;
    };

    socket.on("join_live", async ({ stream_id, broadcaster_id }) => {
        try {
            console.log(`[LiveSocket] User joined stream ${stream_id}`);
            const roomName = `live_stream_${stream_id}`;
            const user_id = socket.user.id;

            socket.join(roomName);
            console.log(`User ${user_id} joined room ${roomName}`);

            // Get current viewer count safely
            const room = io.sockets.adapter.rooms.get(roomName);
            const viewerCount = room ? room.size : 0;

            // Notify everyone in the room about the new viewer count
            io.to(roomName).emit("viewer_count_update", {
                stream_id,
                count: viewerCount
            });

            // Notify the broadcaster that a user joined
            const broadcasterSockets = getSocketsForUser(broadcaster_id);

            if (broadcasterSockets) {
                broadcasterSockets.forEach(socketId => {
                    io.to(socketId).emit("new_viewer_joined", {
                        user_id: user_id,
                        username: socket.user.username || "Guest",
                        profile_picture: socket.user.profile_picture || ""
                    });
                });
            }

        } catch (error) {
            console.log(error);
            socket.emit("error", { message: "Failed to join live stream" });
        }
    });

    socket.on("leave_live", ({ stream_id }) => {
        const roomName = `live_stream_${stream_id}`;
        socket.leave(roomName);
        console.log(`User left room ${roomName}`);

        const room = io.sockets.adapter.rooms.get(roomName);
        const viewerCount = room ? room.size : 0;

        io.to(roomName).emit("viewer_count_update", {
            stream_id,
            count: viewerCount
        });
    });

    socket.on("send_comment", async ({ stream_id, text, user_name }) => {
        try {
            const roomName = `live_stream_${stream_id}`;
            const user_id = socket.user.id;

            // Save comment to database can be added here if needed
            // For now just echo it back
            io.to(roomName).emit("new_comment", {
                user_id: user_id,
                user_name: user_name || socket.user.username,
                message: text,
                timestamp: new Date()
            });
        } catch (e) {
            console.log("Error sending comment:", e);
        }
    });

    socket.on("send_gift", async ({ stream_id, gift_id, gift_name, sender_name }) => {
        try {
            const roomName = `live_stream_${stream_id}`;
            io.to(roomName).emit("new_gift", {
                sender_id: socket.user.id,
                sender_name: sender_name || socket.user.username,
                gift_id,
                gift_name,
                timestamp: new Date()
            });
        } catch (e) {
            console.log("Error sending gift:", e);
        }
    });

    // ----------------------------------------------------
    // NEW: JOIN REQUEST HANDLING (Tango Style)
    // ----------------------------------------------------

    // 1. Viewer requests to join
    socket.on("request_to_join", async ({ stream_id, broadcaster_id }) => {
        try {
            console.log(`[LiveSocket] Join request from ${socket.user.id} to host ${broadcaster_id} for stream ${stream_id}`);

            const requesterData = {
                user_id: socket.user.id,
                full_name: socket.user.full_name || socket.user.username || "Viewer",
                username: socket.user.username,
                profile_picture: socket.user.profile_picture
            };

            // Notify the host
            const broadcasterSockets = getSocketsForUser(broadcaster_id);

            if (broadcasterSockets && broadcasterSockets.size > 0) {
                console.log(`[LiveSocket] Host ${broadcaster_id} found. Emitting request...`);
                broadcasterSockets.forEach(socketId => {
                    io.to(socketId).emit("join_request_received", {
                        stream_id,
                        requester: requesterData,
                        timestamp: new Date()
                    });
                });

                // Confirm to requester
                socket.emit("join_request_sent", { success: true });
            } else {
                console.log(`[LiveSocket] Host ${broadcaster_id} NOT found in onlineUsers.`);
                // We don't log keys here to avoid spam/leaks but we know lookup failed
                socket.emit("error", { message: "Host is not available" });
            }

        } catch (error) {
            console.error("[LiveSocket] Error in request_to_join:", error);
            socket.emit("error", { message: "Failed to process join request" });
        }
    });

    // 2. Host accepts/rejects request
    socket.on("respond_join_request", async ({ stream_id, requester_id, accepted }) => {
        try {
            console.log(`[LiveSocket] Host responded to ${requester_id}: ${accepted ? 'Accepted' : 'Rejected'}`);

            const requesterSockets = getSocketsForUser(requester_id);

            if (requesterSockets && requesterSockets.size > 0) {
                const eventName = accepted ? "join_request_accepted" : "join_request_rejected";

                requesterSockets.forEach(socketId => {
                    io.to(socketId).emit(eventName, {
                        stream_id,
                        host_id: socket.user.id,
                        timestamp: new Date()
                    });
                });
            }

            if (accepted) {
                const roomName = `live_stream_${stream_id}`;
                io.to(roomName).emit("co_broadcaster_added", {
                    user_id: requester_id,
                    stream_id
                });
            }

        } catch (error) {
            console.error("[LiveSocket] Error in respond_join_request:", error);
        }
    });

    // 3. Co-broadcaster leaves (or is removed)
    socket.on("leave_co_broadcast", async ({ stream_id, broadcaster_id }) => {
        try {
            const roomName = `live_stream_${stream_id}`;
            const user_id = socket.user.id;

            console.log(`[LiveSocket] User ${user_id} leaving co-broadcast`);

            io.to(roomName).emit("co_broadcaster_left", {
                user_id: user_id,
                stream_id
            });

        } catch (error) {
            console.error("[LiveSocket] Error in leave_co_broadcast:", error);
        }
    });

};
