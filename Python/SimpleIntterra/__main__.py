import logging
import asyncio
import dotenv

from SimpleIntterra.config import *
from SimpleIntterra.logging import setup_logging
from SimpleIntterra.intterra import run_intterra
from SimpleIntterra.telegrambot import init_telegram_bot, send_message


async def start():
    loop = asyncio.get_running_loop()

    bot = await init_telegram_bot()
    loop.create_task(bot.start_polling())
    # loop.create_task(dp.start_polling())

    loop.create_task(run_intterra())

    await asyncio.Future() # keeps the main task alive


if __name__ == '__main__':
    dotenv.load_dotenv()

    setup_logging()
    logger = logging.getLogger("tapoutbot")
    logger.info('Starting bot')

    logging.getLogger('websockets.client').setLevel(logging.INFO)
    logging.getLogger('urllib3.connectionpool').setLevel(logging.INFO)
    logging.getLogger('aiogram').setLevel(logging.INFO)
    logging.getLogger('asyncio').setLevel(logging.INFO)
    logging.getLogger('selenium').setLevel(logging.INFO)

    # logging.getLogger('aiogram').setLevel(logging.WARNING)
    # logger = logging.getLogger(__name__)
    # logger.info('Starting bot')

    asyncio.run(start())
