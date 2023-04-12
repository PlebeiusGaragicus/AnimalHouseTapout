
import config from './config.js';

import { db, closeMongoDBConnection, connectToMongoDB } from "./database.js";
import { initBot, killBot } from './bot.js';
import { killIntterra, runIntterra } from './intterra.js';


let app_is_closing = false;

export async function closeApp() {

    if (app_is_closing) {
        console.log("App is already closing...");
        return;
    }

    app_is_closing = true;

    console.log("Closing app...");
    try {
        await killBot();
        await killIntterra();
        await closeMongoDBConnection();
        console.log("Closed app successfully");
        process.exit(0);
    } catch (error) {
        console.error("Error closing app: ", error);
        process.exit(1);
    }
}
