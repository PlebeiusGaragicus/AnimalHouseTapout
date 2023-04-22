import dotenv from 'dotenv';

dotenv.config();


export default {
    VERSION: '0.0.1',
    debug: process.env.DEBUG || false,
    port: process.env.PORT || 3000,

    // DATABASE
    DB_COLLECTION_NAME: process.env.DB_COLLECTION_NAME || 'settings',
    DB_USERS_COLLECTION_NAME: process.env.DB_USERS_COLLECTION_NAME || 'users',
    DB_DATABASE_NAME: process.env.DB_DATABASE_NAME || 'AnimalHouseTapout',
    DB_URI: process.env.DB_URI || "mongodb://127.0.0.1:27017/AnimalHouseTapout",

    // URLs
    URL_LOGIN: 'https://apps.intterragroup.com',
    URL_INCIDENT_ENDPOINT: 'https://dc.intterragroup.com/v1/sitstat/data/incidents',

    // BOT MESSAGE REPLIES / CONVERSTAION
    BOT_START_COMMAND: "👹 You want to play a game?\n\n🤫 What is the password?",
    BOT_EMPTY_REPLY: `bro... I'm not a chat bot...
    \nuse /unit to set your unit.
    \nuse /stop when you get off shift
    \nYou are registered on the following units:`,

    BOT_UNREGISTERED_USER_REPLY: "new user... who dis?\nPlease /start to register.",
    BOT_SUCCESSFUL_REGISTER: "Welcome! You are now registered.\n\nuse /unit to set your unit.\n\nuse /stop when you get off shift.",
}
