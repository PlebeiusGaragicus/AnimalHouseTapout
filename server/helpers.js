import logger from './logger.js';
import { closeMongoDBConnection } from "./database.js";
import { killBot } from './telegramBot.js';
import { killIntterra } from './intterra.js';

let app_is_closing = false;

export async function closeApp() {

    if (app_is_closing) {
        logger.info("App is already closing...");
        return;
    }

    app_is_closing = true;

    logger.info("Closing app...");
    try {
        await killBot();
        await killIntterra();
        await closeMongoDBConnection();
        logger.info("Closed app successfully");
        process.exit(0);
    } catch (error) {
        logger.error(`Error closing app: ${error}`);
        process.exit(1);
    }
}
