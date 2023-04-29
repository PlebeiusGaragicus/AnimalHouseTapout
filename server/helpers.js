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




export async function checkENV() {

    if (!config.DB_DATABASE_NAME) {
        logger.error("DB_DATABASE_NAME not set in .env");
        return false;
    }

    if (!config.DB_URI) {
        logger.error("DB_URI not set in .env");
        return false;
    }

    if (!config.REGISTRY_PASSWORD) {
        logger.error("REGISTRY_PASSWORD not set in .env");
        return false;
    }

    if (!config.TELEGRAM_BOT_TOKEN) {
        logger.error("TELEGRAM_BOT_TOKEN not set in .env");
        return false;
    }

    if (!config.INTTERRA_USR || !config.INTTERRA_PSK) {
        logger.error("Intterra username or password not set in database");
        return false;
    } else
        // TODO maybe don't do this?
        console.log(`user: ${user} pass: *****`)



    logger.info("ENV check passed");
    return true;
}




export function exitAppToRestart() {
    logger.warn('Restarting the app...');
    process.exit(0);
}
