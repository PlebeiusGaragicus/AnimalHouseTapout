import os
import asyncio
import requests
import time
import websockets
import json
import logging

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# from AnimalHouseTapout.controller import Controller


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


def get_incident_data(max_retries=3):
    attempts = 0
    while attempts < max_retries:
        try:
            response = requests.post(CONFIG['URL_INCIDENT_ENDPOINT'], headers={
                'authorization': f"Bearer {cookies['access_token']}",
                'cookie': f"access_token={cookies['access_token']}; refresh_token={cookies['refresh_token']}; agstoken={cookies['agstoken']}",
                'referer': "https://apps.intterragroup.com/",
            })

            response.raise_for_status()
            incidents = response.json()

            if isinstance(incidents, list):
                return incidents

        except Exception as e:
            logger.error(f"Error fetching or processing data: {e}")

        attempts += 1
        if attempts < max_retries:
            time.sleep(2)

    logger.error(f"Failed to fetch incident data after {max_retries} attempts")
    return None



def hack_intterra():
    global cookies
    user = os.getenv('INTTERRA_USERNAME')
    password = os.getenv('INTTERRA_PASSWORD')

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
    time.sleep(3)


    # Extracting cookies
    for cookie in browser.get_cookies():
        if cookie['name'] in cookies:
            cookies[cookie['name']] = cookie['value']

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

                    # a 'sitstat' comes in as a list.  Element 0 is 'sitstat', element 1 is the data - dumb, I know...
                    if isinstance(data, dict):
                        print("not sitstat - skipping...")
                        continue

                    print(data[1])
                    handle_websocket_frame_received(data[1])

        except websockets.ConnectionClosed:
            print("WebSocket connection closed, wtf...")
            exit(1)


def handle_websocket_frame_received(data):
    global unit_status_map
    tapped_out_units = set()
    for unit in data['units']:
        unit_id = unit['id']
        incident_id = unit['incidentId']
        lat = unit['latitude']
        lon = unit['longitude']

        # If unit exists and incidentID has changed, handle the change
        if unit_id in unit_status_map and unit_status_map[unit_id]['incidentId'] != incident_id:
            if incident_id is None:
                logger.info(f"{unit_id} cleared")
            else:
                logger.info(f"TAPOUT: {unit_id} on {incident_id}")
                tapped_out_units.add(unit_id)
                
        unit_status_map[unit_id] = {'incidentId': incident_id, 'lat': lat, 'lon': lon}

    if tapped_out_units:
        incidents = get_incident_data()
        if not incidents:
            logger.error("Could not get incident data. This app needs to be restarted.")
            exit(1)
        # await alert_users_for_tapped_out_units(tapped_out_units, incidents)
        print("TAPOUT OMG FUCKING TAPOUT GOD DAMN !!! SHITT AHHH!!!!")

