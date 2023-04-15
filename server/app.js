import express from 'express';
import path from 'path';

import config from './config.js';
import logger from './logger.js';
import { closeApp } from './helpers.js';
import { db, connectToMongoDB } from "./database.js";
import { initBot } from './telegramBot.js';
import { runIntterra } from './intterra.js';


process.on("SIGINT", closeApp);
process.on("SIGTERM", closeApp);
process.on('uncaughtException', (error) => {
    logger.error(error);
});


//// SETUP THE EXPRESS APP
const app = express();
const PORT = config.port;

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
});

app.get("/settings", async (req, res) => {
    const collection = db.collection(config.DB_COLLECTION_NAME);

    const botToken = await collection.findOne({ name: "telegram_bot_token" });
    const registryPassword = await collection.findOne({ name: "registry_password" });
    const intterraUsername = await collection.findOne({ name: "intterra_username" });
    const intterraPassword = await collection.findOne({ name: "intterra_password" });

    res.json({
        botToken: botToken ? botToken.value : "",
        registryPassword: registryPassword ? registryPassword.value : "",
        intterraUsername: intterraUsername ? intterraUsername.value : "",
        intterraPassword: intterraPassword ? intterraPassword.value : "",
    });
});


app.post('/settings', async (req, res) => {
    const { botToken, registryPassword, intterraUsername, intterraPassword } = req.body;

    try {
        const collection = db.collection(DB_COLLECTION_NAME);

        await collection.updateOne({ name: 'telegram_bot_token' }, {
            $set: { value: botToken, name: 'telegram_bot_token' }
        }, { upsert: true });

        await collection.updateOne({ name: 'registry_password' }, {
            $set: { value: registryPassword, name: 'registry_password' }
        }, { upsert: true });

        await collection.updateOne({ name: 'intterra_username' }, {
            $set: { value: intterraUsername, name: 'intterra_username' }
        }, { upsert: true });

        await collection.updateOne({ name: 'intterra_password' }, {
            $set: { value: intterraPassword, name: 'intterra_password' }
        }, { upsert: true });

        res.status(200).send('Settings updated successfully.');
    } catch (error) {
        res.status(500).send('Failed to update settings: ' + error);
    }
});


//// SETUP THE DATABASE
await connectToMongoDB();

initBot();

runIntterra();





//// FEEDBACK:
/*
Overall, your app.js file seems to be well structured and covers the basic functionality of a Node.js web scraper application. However, I'd like to provide some advice, best practices, and tips to help you improve it:

[ ] Use environment variables for sensitive information: Instead of storing sensitive information like API tokens, usernames, and passwords in your database, consider using environment variables. This helps protect sensitive information and is easier to manage when deploying your application.
[ ] Use async/await consistently: Some of your functions use async/await, while others use Promises (e.g., app.post('/settings', async (req, res) => { ... }). Stick to one approach for better readability and consistency.


[ ] Add comments and documentation
[ ] Use a linter: Consider using a linter like ESLint to enforce consistent code style and catch potential issues early on. This can help you write cleaner and more maintainable code.
[ ] Use helmet for security: Add the helmet middleware to your Express app to enable some essential security headers. This can help protect your app from common web vulnerabilities.


[ ] Error handling: Use Express's built-in error handling middleware for better error handling. You can create a custom error handling middleware to send consistent error responses.
[ ] Modularize your routes: Separate your route handling logic into separate modules (e.g., create a routes folder and a file for each route). This can make your code more organized and maintainable.
[ ] Be more specific with your status codes: When sending a response, consider using more specific status codes instead of just 200 and 500. This can help clients understand the response better.
[ ] Here's an example of how you could update the error handling in your Express app using a custom error handling middleware:
*/

// app.use((err, req, res, next) => {
//     console.error(err.stack);
//     res.status(err.status || 500).json({
//       message: err.message || "An unknown error occurred",
//     });
//   });

// [ ] Make sure to place this middleware after your routes. When you want to handle an error, you can pass it to the next() function in your route handlers. For example:
// app.post("/settings", async (req, res, next) => {
//     // ...
//     try {
//       // ...
//     } catch (error) {
//       next(error);
//     }
//   });
