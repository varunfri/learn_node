import mongoose from "mongoose";
import dotenv from "dotenv";
import connectMongo from "./db_config/mongo_connect.js";
import { ChatModel, MessageModel } from "./db_config/mongo_schemas/chat_schema.js";

dotenv.config();

const debug = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${process.env.MONGO_DB}`);
        console.log("Connected to mongo db");

        console.log("--- DEBUGGING CHAT DATA ---");

        const totalChats = await ChatModel.countDocuments({});
        console.log(`Total Chats in DB: ${totalChats}`);

        const totalMessages = await MessageModel.countDocuments({});
        console.log(`Total Messages in DB: ${totalMessages}`);

        if (totalChats > 0) {
            const chats = await ChatModel.find({}).limit(5);
            console.log("Sample Chats:", JSON.stringify(chats, null, 2));

            // Check specific user if needed (replace with an ID you suspect)
            // const specificChats = await ChatModel.find({ participants: "SOME_USER_ID" });
            // console.log("Specific User Chats:", specificChats.length);
        } else {
            console.log("No chats found in database.");
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

debug();
