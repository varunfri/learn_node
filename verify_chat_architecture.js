import mongoose from "mongoose";
import dotenv from "dotenv";
import { ChatModel } from "./db_config/mongo_schemas/chat_schema.js";

dotenv.config();

const verify = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${process.env.MONGO_DB}`);
        console.log("Connected to MongoDB");

        // Use valid user IDs from previous check: 15 and 16
        const userId1 = 15;
        const userId2 = 16;

        console.log(`Creating chat between ${userId1} and ${userId2}...`);

        // Clean up previous test
        await ChatModel.deleteMany({ participants: { $all: [userId1, userId2] } });

        const chat = new ChatModel({
            participants: [userId1, userId2],
            status: "pending",
            requestedBy: userId1,
            unreadCount: new Map(),
        });

        const savedChat = await chat.save();
        console.log("Chat saved successfully!");
        console.log("Chat ID:", savedChat._id);
        console.log("Participants:", savedChat.participants);

        if (typeof savedChat.participants[0] === 'number') {
            console.log("VERIFICATION PASSED: Participants are stored as Numbers.");
        } else {
            console.log("VERIFICATION FAILED: Participants are NOT Numbers.", typeof savedChat.participants[0]);
        }

    } catch (error) {
        console.error("Verification failed:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

verify();
