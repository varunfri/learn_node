// in this file we write main code for starting the express server
import dotenv from "dotenv";
import app from "./app.js";
import { createServer } from "http";
import "./utils/firebaseAdmin.js";
import connectMongo from "./db_config/mongo_connect.js";
import { connect_mysql } from "./db_config/mysql_connect.js";
import { verifySocketToken } from "./middleware/auth_middleware.js";
import { initSocket } from "./utils/init_socket.js";
import { chatRequestHandlers } from "./controller/socket_controllers/message_socket.js";

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
    console.log(`User ${user_id} added with ${socket.id}`);

    chatRequestHandlers(io, socket);

    socket.on("disconnect", async () => {
        console.log("Disconnected user", socket.id);
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
