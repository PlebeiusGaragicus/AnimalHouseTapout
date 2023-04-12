import dotenv from 'dotenv';

dotenv.config();

if (process.env.PASSWORD === undefined) {
    console.error("PASSWORD environment variable not set");
    process.exit(1);
} else {
    console.log("PASSWORD environment variable set: " + process.env.PASSWORD);
}


export default {
    debug: process.env.DEBUG || false,
    port: process.env.PORT || 3000,

    // MongoDB
    DB_DATABASE_NAME: 'AnimalHouseTapout',
    DB_COLLECTION_NAME: 'everything',
    DB_URI: "mongodb://127.0.0.1:27017/AnimalHouseTapout",

    password: process.env.PASSWORD
}
