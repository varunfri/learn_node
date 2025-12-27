// here we create express instance and maintain the required routes for server
import express from "express";
import auth_router from './routes/auth_route.js';
import user_router from './routes/user_profile_route.js';
import location_router from './routes/location_route.js';
import language_router from "./routes/languages_route.js";
import agora_token_route from './routes/stream_token_route.js';
import coins_route from "./routes/coins_route.js";
const app = express();

app.use(express.json()); //making server to use the json() for parsing
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Add this AFTER all your app.use(router) calls




app.get('/', (req, res) => {
    res.send("Server is running");
}); // this route to get to know the server is running 


app.use('/api/auth', auth_router);
app.use('/api/user', user_router);
app.use('/api', location_router);
app.use('/api', language_router)

//agora token router
app.use('/api/live_stream', agora_token_route);

// coins routes
app.use('/api/coins', coins_route);

app.use((req, res) => res.status(404).send("Route not found"));
// export the app 
export default app;