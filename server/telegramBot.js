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
    logger.warn("killing bot...");

    if (bot === null) {
      logger.warn("bot is null - nevermind...");
      resolve();
      return;
    }

    bot
    try {
      await bot.stop();
    } catch (error) {
      logger.error(`ERROR: bot.stop() failed: ${error}`);
      reject();
    }

    const users = await getAllUsers();
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
  logger.debug(`bot token: ${token}`);

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
    logger.info(`ignoring updates while bot was offline: ${update}`);
    await bot.handleUpdate(update);
  }
}



export async function tapoutUser(chatID, call) {
  logger.info("TAPOUT TAPOUT TAPOUT TAPOUT TAPOUT TAPOUT!")

  const msg = `🚨 🚒💨

<b>${call.cadCode} ${call.cadDescription}</b>
${call.narrative}

${call.address}

https://www.google.com/maps/search/?api=1&query=${call.lat}%2C${call.lon}`;

  await bot.telegram.sendMessage(chatID, msg, { parse_mode: 'HTML' });
}




//// FEEDBACK

/*
[ ] Use constants for strings: Extract commonly used strings and user prompts into constants. This can help maintain consistency and make it easier to update these strings in the future.
[ ] Error handling: Add error handling to your bot, especially when interacting with external services like the Telegram API. This can help you handle errors gracefully and provide more informative feedback to users.
[ ] Use a state management library: Instead of using Set to manage user states, consider using a state management library like telegraf-state or a database to store user states. This can help you manage user states more efficiently and make your code more scalable.
*/
