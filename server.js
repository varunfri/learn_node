// in this file we write main code for starting the express server
import dotenv from "dotenv";
import app from "./app.js";
import "./utils/firebaseAdmin.js";
import connectMongo from "./db_config/mongo_connect.js";
import { connect_mysql } from "./db_config/mysql_connect.js";
dotenv.config({
    path: './.env',
});
const startServer = async () => {
    try {
        // if any awaits do pass here
        await connectMongo();
        await connect_mysql();
        const port = process.env.PORT || 8000;
        const server = app.listen(port, () => {
            console.log("Server started with port", port);

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