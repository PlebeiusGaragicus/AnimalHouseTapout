import logging
logger = logging.getLogger("tapoutbot")

import requests
import time

# from SimpleIntterra.config import unit_status_map, my_unit, cookies, CONFIG
from SimpleIntterra.config import *
from SimpleIntterra.telegrambot import tapout_user, send_message



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
                logger.debug(f"Got {len(incidents)} incidents!!")
                # logger.debug(incidents)
                return incidents

        except Exception as e:
            logger.error(f"Error fetching or processing data: {e}")

        attempts += 1
        if attempts < max_retries:
            time.sleep(2)

    logger.error(f"Failed to fetch incident data after {max_retries} attempts")
    return None




async def tapout_units(data):
    # global unit_status_map
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
                logger.warn(f"TAPOUT: {unit_id} on {incident_id}")
                tapped_out_units.add(unit_id)
        
        # update unit_status_map
        unit_status_map[unit_id] = {'incidentId': incident_id, 'lat': lat, 'lon': lon}

    # if tapped_out_units:
    #     incidents = get_incident_data()
    #     if not incidents:
    #         logger.error("Could not get incident data. This app needs to be restarted.")
    #         exit(1)
    #     await alert_users_for_tapped_out_units(tapped_out_units, incidents)

    if my_unit() in tapped_out_units:
        logger.warn(f"TAPOUT: {my_unit()} on {unit_status_map[my_unit()]['incidentId']}")

        incidents = get_incident_data()

        my_incident_id = unit_status_map[my_unit()]['incidentId']

        my_incident = None
        for incident in incidents:
            if incident['id'] == my_incident_id:
                my_incident = incident
                break

        call = {
            "id": my_incident['id'],
            "cadCode": my_incident['cadCode'],
            "cadDescription": my_incident['cadDescription'],
            "address": my_incident['fullAddress'],
            "units": incident['assignedUnits'],
            "lat": my_incident['latitude'],
            "lon": my_incident['longitude'],
            "narrative": my_incident['narrative'],
        }

        await tapout_user(call)




async def check_for_tapout(unit = None):

    if unit == None:
        unit = my_unit()

    logger.info(f"Checking for tapout as unit {unit}")

    incidents = get_incident_data()

    logger.debug("Checking for current call on unit: {unit}")
    for incident in incidents:

        try:
            units = incident['assignedUnits'].split(', ')
        except AttributeError:
            units = [] #BUG: sometimes there are no assigned units on an incident (WHY?!?)

        logger.debug( f"incident['assignedUnits']: { units }" )

        if unit in units: # incident['assignedUnits'] is a comma-separated string
            call = {
                "id": incident['id'],
                "cadCode": incident['cadCode'],
                "cadDescription": incident['cadDescription'],
                "address": incident['fullAddress'],
                "units": incident['assignedUnits'],
                "lat": incident['latitude'],
                "lon": incident['longitude'],
                "narrative": incident['narrative'],
            }

            await tapout_user(call)

            return

    await send_message("Unit is not on a call")


def get_unit_status(unit_id):
    return unit_status_map[unit_id]


def available_units():
    return [unit_id for unit_id, unit_status in unit_status_map.items() if unit_status["incidentId"] is None]

def available_medic_units():
    avail = available_units()

    return [unit_id for unit_id in avail if unit_id[0] == "M" and unit_id[1].isdigit()] # exclude MS391, etc


def available_bls_units():
    avail = available_units()

    return [unit_id for unit_id in avail if unit_id[0] == "B" and unit_id[1].isdigit()]

# get all units on the same call as given unit()
def get_all_units_on_call(unit_id):
    incident_id = unit_status_map[unit_id]["incidentId"]

    return [unit_id for unit_id, unit_status in unit_status_map.items() if unit_status["incidentId"] == incident_id]

def get_all_other_units_on_call(unit_id):
    incident_id = unit_status_map[unit_id]["incidentId"]

    return [uid for uid, unit_status in unit_status_map.items() if unit_status["incidentId"] == incident_id and uid != unit_id]
