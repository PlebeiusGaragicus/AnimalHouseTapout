import os
import logging
logger = logging.getLogger("tapoutbot")

from aiogram import Bot, Dispatcher, types, middlewares

from SimpleIntterra.config import *


_bot = None



class UserRestrictionMiddleware(middlewares.BaseMiddleware):
    async def on_pre_process_message(self, message: types.Message, data: dict):
        print(message.from_user.id)
        print(os.getenv("AUTHORIZED_USER"))
        if message.from_user.id != int(os.getenv("AUTHORIZED_USER")):
            await message.answer("Access Denied: You're not allowed to interact with this bot.")
            return False
        return True



async def send_welcome(message: types.Message):
    await message.reply("/level\n/available\n/unit <unit>")
    # await _bot.send_message("/level\n/available\n/unit <unit>")



async def set_unit(message: types.Message):
    message_text = message.text
    try:
        unit = message_text.split()[1]
    except IndexError:
        # await message.reply(f"You are logged in as: {my_unit()}\nSpecify a unit with `/unit <unit>`", parse_mode='Markdown')
        await _bot.send_message(message.from_user.id, f"You are logged in as: {my_unit()}\nSpecify a unit with `/unit <unit>`", parse_mode='Markdown')
        return

    # global my_unit
    set_my_unit( unit )

    from SimpleIntterra.units import check_for_tapout
    await check_for_tapout() # tap me out if I'm on a call already

    logger.info(f"Logging on as unit {my_unit()}")
    # await message.reply(f"Logging on as unit {my_unit()}")
    await _bot.send_message(message.from_user.id, f"Logging on as unit {my_unit()}")


async def send_level(message: types.Message):
    from SimpleIntterra.units import available_medic_units, available_bls_units

    level = len( available_medic_units() )
    bls_level = len( available_bls_units() )
    # await message.reply(f"ALS Level: {level}\nBLS Level: {bls_level}")
    await _bot.send_message(message.from_user.id, f"ALS Level: {level}\nBLS Level: {bls_level}")


async def send_available(message: types.Message):
    from SimpleIntterra.units import available_medic_units, available_bls_units

    medics = available_medic_units()
    medics.sort()
    bls = available_bls_units()
    bls.sort()

    # await message.reply(f"Available:\nMedic: {medics}\nBLS: {bls}")
    await _bot.send_message(message.from_user.id, f"Available:\nMedic: {medics}\nBLS: {bls}")


async def get_call(message: types.Message):
    from SimpleIntterra.units import check_for_tapout

    message_text = message.text
    try:
        unit = message_text.split()[1]
    except IndexError:
        await _bot.send_message(message.from_user.id, f"Specify a unit with `/gc <unit>`", parse_mode='Markdown')
        return

    await check_for_tapout(unit=unit)


async def list_calls(message: types.Message):
    await message.reply("not yet implemented - bitch")


# Initialize Telegram bot
async def init_telegram_bot():
    global _bot
    _bot = Bot(token=os.getenv("TELEGRAM_BOT_TOKEN"))
    await _bot.send_message(os.getenv("AUTHORIZED_USER"), "Hello world!")
    
    dp = Dispatcher(_bot)

    dp.middleware.setup(UserRestrictionMiddleware())
    # dp.setup_middleware(UserRestrictionMiddleware())

    dp.register_message_handler(set_unit, commands=['unit'])
    dp.register_message_handler(send_level, commands=['level'])
    dp.register_message_handler(send_available, commands=['available'])
    dp.register_message_handler(get_call, commands=['gc'])
    dp.register_message_handler(list_calls, commands=['list'])

    # message handler for replies
    @dp.message_handler()
    async def help_user(msg: types.Message):
        await _bot.send_message(msg.from_user.id, "/level\n/available\n/unit <unit>")

    return dp



async def send_message(message: str):
    await _bot.send_message(os.getenv("AUTHORIZED_USER"), message)


async def tapout_user(call: dict):
    msg = f"""🚨   🚒💨   <b> TAPOUT </b>   🚑💨   🚨

<b>{call['cadCode']} {call['cadDescription']}</b>

{call['narrative'][0]}

{call['units']}

{call['address']}

https://www.google.com/maps/search/?api=1&query={call['lat']}%2C{call['lon']}"""

    await _bot.send_message(os.getenv("AUTHORIZED_USER"), msg, parse_mode='HTML')
