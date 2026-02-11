import mongoose from "mongoose";
import { Schema } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${process.env.MONGO_DB}`);
        console.log("Connected to MongoDB");

        // Define the schema exactly as in project
        const chatSchema = new Schema({
            participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
            status: { type: String, default: "pending" }
        });
        const ChatModel = mongoose.model("TestChat", chatSchema);

        console.log("Attempting to save chat with SQL-like Integer ID...");

        try {
            // Simulate MySQL ID (e.g., 123)
            const chat = new ChatModel({
                participants: [123, 456],
                status: "pending"
            });
            await chat.save();
            console.log("Saved successfully (Unexpected!)");
        } catch (e) {
            console.log("Save failed as expected:");
            console.log(e.message);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
