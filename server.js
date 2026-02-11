// in this file we write main code for starting the express server
import dotenv from "dotenv";
import app from "./app.js";
import { createServer } from "http";
import "./utils/firebaseAdmin.js";
import connectMongo from "./db_config/mongo_connect.js";
import { connect_mysql } from "./db_config/mysql_connect.js";
import { verifySocketToken } from "./middleware/auth_middleware.js";
import { initSocket } from "./utils/init_socket.js";
import { messageSocketHandlers } from "./controller/socket_controllers/message_socket.js";
import { liveStreamHandlers } from "./controller/socket_controllers/live_socket.js";

const httpServer = createServer(app);

dotenv.config({
    path: './.env',
});

const io = initSocket(httpServer);
io.use(verifySocketToken);

export const onlineUsers = new Map();

io.on("connection", async (socket) => {
    const user_id = socket.user.id;
    onlineUsers.set(user_id, socket.id);
    console.log(`User ${user_id} connected with socket ${socket.id}`);

    // Initialize socket handlers
    messageSocketHandlers(io, socket);
    liveStreamHandlers(io, socket);

    socket.on("disconnect", async () => {
        onlineUsers.delete(user_id);
        console.log(`User ${user_id} disconnected from socket ${socket.id}`);
        socket.rooms.forEach(roomName => {
            if (roomName.startsWith("chat_")) {
                socket.to(roomName).emit("user_offline", {
                    user_id,
                    chatId: roomName.replace("chat_", ""),
                    timestamp: new Date(),
                });
            }
        });
    });
});



const startServer = async () => {
    try {
        // if any awaits do pass here
        await connectMongo();
        await connect_mysql();

        const port = process.env.PORT || 8000;

        const server = httpServer.listen(port, () => {
            console.log("Socket and Server is running on port ", port);
            console.log(`Swagger UI on http://localhost:${port}/api-docs`);

        });
        server.on("error", (err) => {
            console.log("Unable to start server", err.message);
            throw err;
        });

    } catch (e) {
        console.log("Unable to start server", e);
        throw e;
    }
};

startServer(); //this triggers auto matically
