import mongoose from "mongoose";

const connectMongo = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${process.env.MONGO_DB}`);
        //mongo_uri = mongodb://localhost:27017/learn_node 
        console.log("Connected to mongo db");
    } catch (e) {
        console.log("Error while connecting to mongo server ", e)
        process.exit(1);
    }
};


export default connectMongo;