// here we create express instance and maintain the required routes for server

import express from "express";

const app = express();

app.use(express.json());


app.get('/', (req, res) => {
    res.send("Server is running");
});
// export the app 
export default app;