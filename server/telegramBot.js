import { Telegraf } from 'telegraf';

import config from './config.js';
import logger from './logger.js';
import { getValue, getAllUsers } from './database.js';
import { handleStartCommand, handleUnitCommand, handleStopCommand, handleText } from './botCommands.js'


export let bot = null;


export async function setupBot(bot) {
    bot.command('start', handleStartCommand);
    bot.command('unit', handleUnitCommand);
    bot.command('stop', handleStopCommand);

    bot.on('text', handleText);
}


export async function killBot() {
    return new Promise(async (resolve, reject) => {
        // console.log("killing bot...");
        logger.info("killing bot...");

        if (bot === null) {
            // console.log("bot is null - nevermind...");
            logger.info("bot is null - nevermind...");
            resolve();
            return;
        }

        bot
        try {
            await bot.stop();
        } catch (error) {
            // console.error("ERROR: bot.stop() failed:", error);
            logger.error("ERROR: bot.stop() failed:", error);
            reject();
        }

        const users = await getAllUsers();
        // console.log("users:", users);
        logger.info("users:", users);

        if (!users) {
            logger.info("no users - exiting...");
            resolve();
            return;
        }

        // TODO - maybe only tell ME that the bot is shutting down... or has an error?  (but sometimes it doesn't do this...)
        // console.log("Telling the users the bot is shutting down...")
        // for (const u of users) {
        //     console.log("telling user:", u.user_chat_id);
        //     await
        //         bot.telegram.sendMessage(u.user_chat_id, `⚠️ *BOT SHUTDOWN\\!* ⚠️`, { parse_mode: 'MarkdownV2' })
        //             .then(() => {
        //                 console.log("process exiting...");
        //             })
        //             .catch((err) => {
        //                 console.error(err);
        //                 reject(err);
        //             });
        // }
        resolve();
    });
};


export async function initBot() {
    logger.info("starting bot...");

    const token = await getValue("telegram_bot_token");
    // TODO: don't log this?
    logger.info("bot token:", token);

    if (token == null) {
        logger.error("ERROR: Telegram bot token is not set.");
        return;
    }

    bot = new Telegraf(token);

    await clearPendingMessages();

    bot.launch();
    setupBot(bot);
}


async function clearPendingMessages() {
    let updates = await bot.telegram.getUpdates();

    for (const update of updates) {
        logger.info("ignoring updates while bot was offline:", update);
        await bot.handleUpdate(update);
    }
}





//// FEEDBACK

/*
[ ] Use constants for strings: Extract commonly used strings and user prompts into constants. This can help maintain consistency and make it easier to update these strings in the future.
[ ] Modularize your code: Separate your command handlers into separate functions or even different files. This can help make your code more organized and maintainable.
async function handleUnitCommand(ctx) {
    if (await userExists(ctx.from.id)) {
      ctx.reply("Please enter your unit:");
      usersAwaitingUnit.add(ctx.from.id);
    } else {
      ctx.reply("Please register using the /start command before setting your unit.");
    }
  }
  
  async function handleStopCommand(ctx) {
    if (await userExists(ctx.from.id)) {
      const updateSuccessful = await updateUserUnit(ctx.from.id, "");
  
      if (updateSuccessful) {
        ctx.reply("Unit cleared. Have a good day!");
      } else {
        ctx.reply("Failed to clear unit. Please try again.");
      }
    } else {
      ctx.reply("Please register using the /start command before using the /stop command.");
    }
  }
  
  export async function setupBot(bot) {
    bot.command("start", handleStartCommand);
    bot.command("unit", handleUnitCommand);
    bot.command("stop", handleStopCommand);
    bot.on("text", handleText);
  }
  
  // Use template literals for better readability
  ctx.reply(`bro... I'm not a chat bot...
  \nuse /unit to set your unit.
  \nuse /stop when you get off shift
  \nYou are registered on the following units: ${await getUserUnit(ctx.from.id)}`);




[ ] Add comments and documentation: Write comments and documentation to describe the functionality of your code. This can help other developers understand your code better and make it easier for you to maintain your code in the future.
[ ] Error handling: Add error handling to your bot, especially when interacting with external services like the Telegram API. This can help you handle errors gracefully and provide more informative feedback to users.
[ ] Use a state management library: Instead of using Set to manage user states, consider using a state management library like telegraf-state or a database to store user states. This can help you manage user states more efficiently and make your code more scalable.
[ ] Here's an example of how you could modularize your command handlers and use template literals:
*/