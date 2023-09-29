from AnimalHouseTapout.controller import Controller

from queue import Queue
from telegram import Update, Bot
from telegram.ext import Updater, CommandHandler

def start(update, context):
    if update.message.from_user.id != Controller.get_instance().AUTHORIZED_USER:
        return  # Ignore messages from other users

    update.message.reply_text('Hello, sir!')


def initTelegramBot():
    # updater = Updater(Controller.get_instance().BOT_TOKEN, )
    update_queue = Queue()  # Create a new Queue instance to share between the main thread and the bot thread

    bot = Bot(Controller.get_instance().BOT_TOKEN)

    updater = Updater(bot=bot, update_queue=update_queue)

    updater.bot.

    # dp = updater.dispatcher
    # dp.add_handler(CommandHandler("start", start))

    updater.start_polling()
    updater.idle()
