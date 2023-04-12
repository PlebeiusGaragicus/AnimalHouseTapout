import express from 'express';
import path from 'path';

import config from './config.js';
import { closeApp } from './helpers.js';
import { db, connectToMongoDB } from "./database.js";
import { initBot } from './bot.js';
import { runIntterra } from './intterra.js';


process.on("SIGINT", closeApp);
process.on("SIGTERM", closeApp);

process.on('uncaughtException', (error) => {
    console.log(" ++++++++++ You done goofed ++++++++++ ");
    console.error(error);
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
    console.log(`Server is running on http://localhost:${PORT}`);
});

app.get("/settings", async (req, res) => {
    // TODO: should I just redo this whole function with getters?
    const collection = db.collection(config.DB_COLLECTION_NAME);

    const botToken = await collection.findOne({ name: "telegram_bot_token" });
    const intterraUsername = await collection.findOne({ name: "intterra_username" });
    const intterraPassword = await collection.findOne({ name: "intterra_password" });

    res.json({
        botToken: botToken ? botToken.value : "",
        intterraUsername: intterraUsername ? intterraUsername.value : "",
        intterraPassword: intterraPassword ? intterraPassword.value : "",
    });
});


app.post('/settings', async (req, res) => {
    const { botToken, intterraUsername, intterraPassword } = req.body;

    // TODO: should I just redo this whole function with setters?
    try {
        const collection = db.collection(config.DB_COLLECTION_NAME);

        await collection.updateOne({ name: 'telegram_bot_token' }, {
            $set: { value: botToken, name: 'telegram_bot_token' }
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
