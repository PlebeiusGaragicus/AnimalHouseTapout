import websockets
import logging
import asyncio
import json
import websockets
import time
from aiohttp import web
from aiogram import Bot, Dispatcher, types


from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Initialize Telegram bot
TOKEN = "6213628579:AAHsLojnrYF9MXCsAZOCwoBcEUXphk5hTGM"
bot = Bot(token=TOKEN)
dp = Dispatcher(bot)

# Define bot handler
@dp.message_handler(commands=['start', 'help'])
async def send_welcome(message: types.Message):
    await message.reply("Hi!\nI'm your bot!")



CONFIG = {
    'URL_LOGIN': 'https://apps.intterragroup.com',
    'URL_INCIDENT_ENDPOINT': 'https://dc.intterragroup.com/v1/sitstat/data/incidents'
}

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

cookies = {
    'access_token': None,
    'refresh_token': None,
    'agstoken': None,
}

unit_status_map = {}




def hack_intterra():
    global cookies
    user = 'sta9'
    password = 'PFRsta9!'

    # Set up a Selenium WebDriver to perform the login and get the cookies
    browser = webdriver.Chrome()
    browser.get(CONFIG['URL_LOGIN'])

    input_box = WebDriverWait(browser, 10).until(
        EC.presence_of_element_located((By.ID, 'name'))
    )
    input_box.send_keys(user)

    input_box = WebDriverWait(browser, 10).until(
        EC.presence_of_element_located((By.ID, 'password'))
    )
    input_box.send_keys(password)

    input_box = WebDriverWait(browser, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, 'button.primary'))
    )
    input_box.click()

    # wait for any redirects to complete and cookies to be set
    # await asyncio.sleep(3)
    time.sleep(5)


    # Extracting cookies
    for cookie in browser.get_cookies():
        if cookie['name'] in cookies:
            cookies[cookie['name']] = cookie['value']
    
    print(cookies)

    browser.quit()



async def run_intterra():
    hack_intterra()

    global cookies
    base_uri = "wss://dc.intterragroup.com/nrte/"
    params = {
        "access_token": cookies['access_token'],
        "EIO": "1",
        "transport": "websocket"
    }
    uri = base_uri + '?' + '&'.join([f'{key}={value}' for key, value in params.items()])

    while True:
        try:
            async with websockets.connect(uri) as ws:
                async for message in ws:
                    print(message)
                    if message == "44\"Invalid Token\"":
                        print("LOGIN FAILED")
                        exit(1)

                    cleaned_message = message.lstrip('0123456789')
                    if not cleaned_message:
                        continue

                    data = json.loads(cleaned_message)

                    if isinstance(data, dict):
                        print("not sitstat - skipping...")
                        continue

                    print(data[1])
                    # handle_websocket_frame_received(data[1])  # Call your handler here
        except websockets.ConnectionClosed:
            print("WebSocket connection closed, wtf...")
            exit(1)



async def main():
    loop = asyncio.get_running_loop()
    loop.create_task(dp.start_polling())
    loop.create_task(run_intterra())
    await asyncio.Future()  # to keep the main task alive

if __name__ == '__main__':
    asyncio.run(main())
