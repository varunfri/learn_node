// here we create express instance and maintain the required routes for server
import express from "express";
import auth_router from './routes/auth_route.js';
import user_router from './routes/user_profile_route.js';
import location_router from './routes/location_route.js';
import language_router from "./routes/languages_route.js";
import agora_token_route from './routes/stream_token_route.js';
import coins_route from "./routes/coins_route.js";
import gift_routes from './routes/gifts_route.js';
import image_route from './utils/image_kit_config.js';
import get_live_users_route from './routes/live_routes.js';
import get_all_users_route from './routes/all_users_route.js';
import chat_router from './routes/chat_route.js';
import media_router from './routes/media_route.js';
import { swaggerDocs } from "./swagger/swagger.js";

const app = express();

app.use(express.json()); //making server to use the json() for parsing
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Add this AFTER all your app.use(router) calls


swaggerDocs(app);

app.get('/', (req, res) => {
    res.send("Server is running");
}); // this route to get to know the server is running 
app.set('trust proxy', true);


app.use('/api/auth', auth_router);
app.use('/api/user', user_router);
app.use('/api', location_router);
app.use('/api', language_router)

//agora token router and other live routes
app.use('/api/live_stream', agora_token_route);
app.use('/api/live_stream', get_live_users_route);

// fetch all users
app.use('/api/users', get_all_users_route);

// coins routes
app.use('/api/coins', coins_route);

//gifts 
app.use('/api/gifts', gift_routes);

//image uploading
app.use('/api/images', image_route);

// chat routes
app.use('/api/chats', chat_router);

// media routes
app.use('/api/media', media_router);

app.use((req, res) => res.status(404).send("Route not found"));

// export the app 
export default app;
