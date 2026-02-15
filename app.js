// here we create express instance and maintain the required routes for server
import express from "express";
import auth_router from './routes/auth_route.js';
import user_router from './routes/user_profile_route.js';
import location_router from './routes/location_route.js';
import language_router from "./routes/languages_route.js";
import agora_token_route from './routes/stream_token_route.js';
import user_coins_route from "./routes/user_coins_route.js";
import admin_coins_route from "./routes/admin_coin_route.js";
import admin_gift_routes from './routes/admin_gifts_route.js';
import image_route from './utils/image_kit_config.js';
import get_live_users_route from './routes/live_routes.js';
import get_all_users_route from './routes/all_users_route.js';
import chat_router from './routes/chat_route.js';
import media_router from './routes/media_route.js';
import follow_routes from './routes/follow_route.js';
import user_gift_routes from "./routes/user_gift_routes.js";
import web_hook from "./routes/web_hook_route.js";
import agency_router from "./routes/agency_routes.js";
import reseller_router from "./routes/reseller_routes.js";
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
app.use('/api/user_coins', user_coins_route);
app.use('/api/admin_coins', admin_coins_route);

//gifts 
app.use('/api/admin_gift', admin_gift_routes);
app.use('/api/user_gift', user_gift_routes);

//image uploading
app.use('/api/images', image_route);

// chat routes
app.use('/api/chats', chat_router);

// media routes
app.use('/api/media', media_router);
app.use('/api/follow', follow_routes);
app.use('/api/agency', agency_router);
app.use('/api/reseller', reseller_router);
app.use("/api", web_hook);
app.use((req, res) => res.status(404).send("Route not found"));
// export the app 
export default app;
