import logger from './logger.js';
import { closeMongoDBConnection } from "./database.js";
import { killBot } from './telegramBot.js';
import { killIntterra } from './intterra.js';

let app_is_closing = false;

export async function closeApp() {

    if (app_is_closing) {
        // console.log("App is already closing...");
        logger.info("App is already closing...");
        return;
    }

    app_is_closing = true;

    // console.log("Closing app...");
    logger.info("Closing app...");
    try {
        await killBot();
        await killIntterra();
        await closeMongoDBConnection();
        // console.log("Closed app successfully");
        logger.info("Closed app successfully");
        process.exit(0);
    } catch (error) {
        // console.error("Error closing app: ", error);
        logger.error("Error closing app: ", error);
        process.exit(1);
    }
}
