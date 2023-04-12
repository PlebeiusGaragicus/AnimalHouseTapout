import { Telegraf } from 'telegraf';

import config from './config.js';
import { userExists, addUser, getValue, getUserUnit, updateUserUnit, getAllUsers } from './database.js';

export let bot = null;


const usersAwaitingPassword = new Set();
const usersAwaitingUnit = new Set();


async function handleStartCommand(ctx) {
    console.log("start command called - CHAT ID: ", ctx.chat.id, " - FROM: ", ctx.from.username, "User ID: ", ctx.from.id);

    if (await userExists(ctx.from.id)) {
        console.log("but they are already a registered user");
        ctx.reply("You are a registered user!");

        const unit = await getUserUnit(ctx.from.id);
        if (unit === "") {
            ctx.reply("Your unit is not set!");
            ctx.reply("Use /unit to set your unit\n\nuse /stop when you get of shift");
        } else {
            ctx.reply(`You will be tapped out for: ${unit}`);
            ctx.reply("Use /unit to set your unit\n\nuse /stop when you get of shift");
        }

        return;
    }

    ctx.reply("👹 You want to play a game?\n\n🤫 What is the password?");
    usersAwaitingPassword.add(ctx.from.id);
}



async function handleText(ctx) {
    if (usersAwaitingPassword.has(ctx.from.id)) {
        console.log("FROM UNKNOWN USER: ", ctx.from.username, " - ", ctx.from.id);
        console.log("PASSWORD: ", ctx.message.text);

        console.log("Correct password: ", config.password);

        // Check the entered password against your predefined password
        if (ctx.message.text == config.password) {
            // Add the new user to the database
            await addUser(ctx.from.id, ''); // You can set the unit value as needed

            // Remove the user from the usersAwaitingPassword set
            usersAwaitingPassword.delete(ctx.from.id);

            ctx.reply("Welcome! You are now registered.\n\nuse /unit to set your unit.\n\nuse /stop when you get off shift.");
        } else {
            ctx.reply("Incorrect password. Please try again.");
        }
    } else if (usersAwaitingUnit.has(ctx.from.id)) {
        const unit = ctx.message.text;
        const updateSuccessful = await updateUserUnit(ctx.from.id, unit);
        if (updateSuccessful) {
            usersAwaitingUnit.delete(ctx.from.id);
            ctx.reply(`Unit updated to ${unit}.`);
        } else {
            ctx.reply("Failed to update unit. Please try again.");
        }
    } else {

        if (await userExists(ctx.from.id)) {
            console.log("FROM USER: ", ctx.from.username, " - ", ctx.from.id);
            console.log("MESSAGE: ", ctx.message.text);

            ctx.reply("bro... I'm not a chat bot...\n\nuse /unit to set your unit.\n\nuse /stop when you get off shift\n\nYou are registered on the following units: " + await getUserUnit(ctx.from.id));
        } else {
            console.log("FROM UNKNOWN USER: ", ctx.from.username, " - ", ctx.from.id);
            console.log("MESSAGE: ", ctx.message.text);

            ctx.reply("new user... who dis?\nPlease /start to register.");
        }
    }
}




export async function setupBot(bot) {
    bot.command('start', handleStartCommand);

    bot.command('unit', async ctx => {
        if (await userExists(ctx.from.id)) {
            ctx.reply("Please enter your unit:");
            usersAwaitingUnit.add(ctx.from.id);
        } else {
            ctx.reply("Please register using the /start command before setting your unit.");
        }
    });

    bot.command('stop', async ctx => {
        if (await userExists(ctx.from.id)) {
            const updateSuccessful = await updateUserUnit(ctx.from.id, '');

            if (updateSuccessful) {
                ctx.reply("Unit cleared. Have a good day!");
            } else {
                ctx.reply("Failed to clear unit. Please try again.");
            }
        } else {
            ctx.reply("Please register using the /start command before using the /stop command.");
        }
    });

    bot.on('text', handleText);
}


export async function killBot() {
    return new Promise(async (resolve, reject) => {
        console.log("killing bot...");

        if (bot === null) {
            console.log("bot is null - nevermind...");
            resolve();
            return;
        }

        bot
        try {
            await bot.stop();
        } catch (error) {
            console.error("ERROR: bot.stop() failed:", error);
        }

        const users = await getAllUsers();
        console.log("users:", users);

        if (!users) {
            console.log("no users - exiting...");
            resolve();
            return;
        }

        console.log("Telling the users the bot is shutting down...")
        for (const u of users) {
            console.log("telling user:", u.user_chat_id);
            await
                bot.telegram.sendMessage(u.user_chat_id, `⚠️ *BOT SHUTDOWN\\!* ⚠️`, { parse_mode: 'MarkdownV2' })
                    .then(() => {
                        console.log("process exiting...");
                    })
                    .catch((err) => {
                        console.error(err);
                        reject(err);
                    });
        }
        resolve();
    });
};


export async function initBot() {
    console.log("Starting bot...");

    const token = await getValue("telegram_bot_token");
    console.log("bot token:", token);

    if (token == null) {
        console.error("ERROR: Telegram bot token is not set.");
        process.exit(1);
    }

    bot = new Telegraf(token);

    bot.launch();
    setupBot(bot);
}
