import config from './config.js';
import logger from './logger.js';
import { userExists, addUser, getValue, getUserUnit, updateUserUnit, getAllUsers } from './database.js';


const usersAwaitingPassword = new Set();
const usersAwaitingUnit = new Set();


export async function handleStartCommand(ctx) {
    // console.log("start command called - CHAT ID: ", ctx.chat.id, " - FROM: ", ctx.from.username, "User ID: ", ctx.from.id);
    logger.info("start command called - CHAT ID: ", ctx.chat.id, " - FROM: ", ctx.from.username, "User ID: ", ctx.from.id);

    if (await userExists(ctx.from.id)) {
        // console.log("but they are already a registered user");
        logger.info("This user is already registered.")

        // TODO: add a help message here
        ctx.reply("You are a registered user!");

        const unit = await getUserUnit(ctx.from.id);
        // TODO - huh?  Write this flow out more precicely.  What happens here?
        if (unit === "") {
            ctx.reply("Your unit is not set!");
            ctx.reply("Use /unit to set your unit\n\nuse /stop when you get of shift");
        } else {
            ctx.reply(`You will be tapped out for: ${unit}`);
            ctx.reply("Use /unit to set your unit\n\nuse /stop when you get of shift");
        }

        return;
    }

    ctx.reply(config.BOT_START_COMMAND);
    usersAwaitingPassword.add(ctx.from.id);
}


export async function handleUnitCommand(ctx) {
    if (await userExists(ctx.from.id)) {
        ctx.reply("Please enter your unit:");
        usersAwaitingUnit.add(ctx.from.id);
    } else {
        // TODO: attempt this flow... can a non-registered user trigger this code? (well, if I remove someone from the database and they keep trying to use the bot next time they're on shift?)
        ctx.reply("Please register using the /start command before setting your unit.");
    }
}


// TODO: add a failed password counter and ban users for 3 days
export async function handleText(ctx) {
    if (usersAwaitingPassword.has(ctx.from.id)) {
        // console.log("FROM UNKNOWN USER: ", ctx.from.username, " - ", ctx.from.id);
        // console.log("PASSWORD: ", ctx.message.text);
        logger.info(`a password attempt from: ${ctx.from.username} - ${ctx.from.id} was ${ctx.message.text}`);

        const correct_password = await getValue("registry_password")

        // NOTE: I think best practice says that we don't log this...
        // console.log("Correct password: ", correct_password);


        // Check the entered password against your predefined password
        if (ctx.message.text == correct_password) {
            // Add the new user to the database
            await addUser(ctx.from.id, ''); // You can set the unit value as needed

            // Remove the user from the usersAwaitingPassword set
            usersAwaitingPassword.delete(ctx.from.id);

            ctx.reply(config.BOT_SUCCESSFUL_REGISTER);
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
            logger.info(`MESSAGE FROM USER: ${ctx.from.username} - ${ctx.from.id} = '${ctx.message.text}'`);

            // "bro... I'm not a chat bot.. etc... then HELP info to get them on track"
            ctx.reply(`${config.BOT_EMPTY_REPLY} ${await getUserUnit(ctx.from.id)}`);
        } else {
            logger.info(`MESSAGE FROM UNKNOWN USER: ${ctx.from.username} - ${ctx.from.id} = '${ctx.message.text}'`);

            // "new user... who dis?"
            ctx.reply(config.BOT_UNREGISTERED_USER_REPLY);
        }
    }
}


export async function handleStopCommand(ctx) {
    if (await userExists(ctx.from.id)) {
        const updateSuccessful = await updateUserUnit(ctx.from.id, '');

        if (updateSuccessful) {
            ctx.reply("No more alerts for you!  Have a good day!  Make good choices and take care of yourself! 💕");
            ctx.reply("Next shift make sure to set your /unit.")
        } else {
            // TODO fucking yikes... how would I diagnose this?!?  I should log these fails for sure!
            logger.error("An error has prevented a user from stopping unit updates.")
            ctx.reply("Some error happened - try again.  If this doesn't resolve then just mute me.");
        }
    } else {
        ctx.reply("Please register using the /start command before using the /stop command.");
    }
}