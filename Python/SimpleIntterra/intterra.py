import os
import websockets
import json
import websockets
import time

import logging
logger = logging.getLogger("tapoutbot")

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from SimpleIntterra.config import *
from SimpleIntterra.units import tapout_units



def hack_intterra():
    logger.info("Logging into Intterra")

    global cookies
    user = 'sta9'
    password = 'PFRsta9!'

    # Set up a Selenium WebDriver to perform the login and get the cookies
    options = webdriver.ChromeOptions()
    if os.getenv("DEBUG", False):
        options.add_argument('--headless')

    browser = webdriver.Chrome(options=options)
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
                    if message == "44\"Invalid Token\"":
                        logger.error("Login failed!")
                        exit(1)

                    cleaned_message = message.lstrip('0123456789')
                    if not cleaned_message:
                        continue

                    data = json.loads(cleaned_message)

                    if isinstance(data, dict):
                        # print("not sitstat - skipping...")
                        continue

                    if data[0] == "sitstat":
                        # print(data[1])
                        # print(unit_status_map)
                        await handle_websocket_frame_received(data[1])  # Call your handler here


        except websockets.ConnectionClosed:
            print("WebSocket connection closed, wtf...")
            exit(1)


async def handle_websocket_frame_received(data):
    await tapout_units(data)

    # TODO: do other cool analysis here... I guess
