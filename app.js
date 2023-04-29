// import express from 'express';
// import path from 'path';

import config from './server/config.js';
import logger from './server/logger.js';
import { closeApp, checkENV, exitAppToRestart } from './server/helpers.js';
import { connectToMongoDB } from "./server/database.js";
import { initBot } from './server/telegramBot.js';
import { runIntterra } from './server/intterra.js';

logger.info('>> APP STARTED <<')
logger.info(`version: ${config.VERSION}`)


process.on("SIGINT", closeApp);
process.on("SIGTERM", closeApp);
process.on('uncaughtException', (error) => {
    logger.error(error);
    // closeApp();
});
// process.on('unhandledRejection', (error) => {
//     logger.error('unhandledRejection', error);
//     closeApp();
// });


if (!checkENV()) {
    logger.error("ENV check failed");
    await closeApp();
}

//// SETUP THE DATABASE
await connectToMongoDB();

await initBot();

await runIntterra();

// TODO - make a note here explaining why and what I found in the logs
setInterval(exitAppToRestart, 1000 * 60 * 60 * 11) // restart the app every 11 hours






//// SETUP THE EXPRESS APP
// const app = express();
// const PORT = config.port;

// app.use(express.json());
// app.use(express.static(path.join(process.cwd(), 'public')));
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// app.listen(PORT, () => {
//     logger.info(`Server is running on http://localhost:${PORT}`);
// });

// app.get("/settings", async (req, res) => {
//     const collection = db.collection(config.DB_COLLECTION_NAME);

//     const botToken = await collection.findOne({ name: "telegram_bot_token" });
//     const registryPassword = await collection.findOne({ name: "registry_password" });
//     const intterraUsername = await collection.findOne({ name: "intterra_username" });
//     const intterraPassword = await collection.findOne({ name: "intterra_password" });

//     res.json({
//         botToken: botToken ? botToken.value : "",
//         registryPassword: registryPassword ? registryPassword.value : "",
//         intterraUsername: intterraUsername ? intterraUsername.value : "",
//         intterraPassword: intterraPassword ? intterraPassword.value : "",
//     });
// });


// app.post('/settings', async (req, res) => {
//     const { botToken, registryPassword, intterraUsername, intterraPassword } = req.body;

//     try {
//         const collection = db.collection(DB_COLLECTION_NAME);

//         await collection.updateOne({ name: 'telegram_bot_token' }, {
//             $set: { value: botToken, name: 'telegram_bot_token' }
//         }, { upsert: true });

//         await collection.updateOne({ name: 'registry_password' }, {
//             $set: { value: registryPassword, name: 'registry_password' }
//         }, { upsert: true });

//         await collection.updateOne({ name: 'intterra_username' }, {
//             $set: { value: intterraUsername, name: 'intterra_username' }
//         }, { upsert: true });

//         await collection.updateOne({ name: 'intterra_password' }, {
//             $set: { value: intterraPassword, name: 'intterra_password' }
//         }, { upsert: true });

//         res.status(200).send('Settings updated successfully.');
//     } catch (error) {
//         res.status(500).send('Failed to update settings: ' + error);
//     }
// });






