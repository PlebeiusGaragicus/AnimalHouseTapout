import puppeteer from 'puppeteer';
import fetch from 'node-fetch';

import config from './config.js';
import logger from './logger.js';
import { getValue, getAllUsers } from './database.js';
import { tapoutUser } from './telegramBot.js';


// REFERENCE: the path to the units: https://dc.intterragroup.com/v1/sitstat/data/units
// https://developers.google.com/maps/documentation/urls/get-started


let browser = null;
let page = null;

let cookies = {
    access_token: null,
    refresh_token: null,
    agstoken: null,
}


/**
 * Fetches incident data from the specified endpoint with a given number of retries.
 *
 * @async
 * @param {number} [maxRetries=3] - The maximum number of retry attempts to fetch incident data.
 * @returns {Promise<Array|null>} Returns the fetched incident data as an array or null if the attempts failed.
 * @throws {Error} If there's an error while processing the fetched data.
 */
async function getIncidentData(maxRetries = 3) {
    let incidents = null;
    let attempts = 0;

    while (incidents === null && attempts < maxRetries) {
        try {
            incidents = await fetch(config.URL_INCIDENT_ENDPOINT, {
                "headers": {
                    "accept": "application/json, text/javascript, */*; q=0.01",
                    "accept-language": "en-US,en;q=0.9",
                    "authorization": "Bearer " + cookies.access_token,
                    "sec-ch-ua": "\"Not:A-Brand\";v=\"99\", \"Chromium\";v=\"112\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"macOS\"",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-site",
                    "cookie": "access_token=" + cookies.access_token + "; refresh_token=" + cookies.refresh_token + "; agstoken=" + cookies.agstoken,
                    "Referer": "https://apps.intterragroup.com/",
                    "Referrer-Policy": "strict-origin-when-cross-origin"
                },
                "body": null,
                "method": "POST"
            })
                .then(res => res.json())
                .catch(err => {
                    logger.error(`Error fetching data: ${err}`);
                    return null;
                });

            // still printing [object Object], ...
            logger.debug({ incidents });

            // If the fetched data is not an array, set incidents to null so that the loop continues.
            if (!Array.isArray(incidents)) {
                incidents = null;
            }
        } catch (err) {
            logger.error(`Error processing fetched data: ${err}`);
        }

        attempts++;
        if (incidents === null && attempts < maxRetries) {
            // If you want to wait before retrying, you can use a delay (in milliseconds).
            // For example, wait 2 seconds (2000 ms) before the next attempt:
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    if (incidents === null) {
        logger.error(`Failed to fetch incident data after ${maxRetries} attempts`);
        // You can throw a custom exception here or handle the error as you wish
    }

    return incidents;
}

async function getCookies(page) {
    // TODO: instead I could log if they change or not... instead of placing them in a log file (security risk?)
    logger.debug("OLD COOKIES:");
    logger.debug(`access_token: ${cookies.access_token}`);
    logger.debug(`refresh_token: ${cookies.refresh_token}`);
    logger.debug(`agstoken: ${cookies.agstoken}`);

    const page_cookies = await page.cookies();
    const at = page_cookies.find(cookie => cookie.name === 'access_token');
    cookies.access_token = at.value;

    const rt = page_cookies.find(cookie => cookie.name === 'refresh_token');
    cookies.refresh_token = rt.value;

    // This token seems to change a few times after login and needs time to "settle"
    const ags = page_cookies.find(cookie => cookie.name === 'agstoken');
    cookies.agstoken = ags.value;

    logger.debug("NEW COOKIES:");
    logger.debug(`access_token: ${cookies.access_token}`);
    logger.debug(`refresh_token: ${cookies.refresh_token}`);
    logger.debug(`agstoken: ${cookies.agstoken}`);
}


export async function runIntterra() {
    if (browser) {
        logger.warn("Intterra is already running");
        return;
    }

    const user = await getValue('intterra_username');
    const pass = await getValue('intterra_password');
    // TODO maybe don't do this?
    // logger.debug(`user: ${user} pass: ${pass}`);
    // if (!user || !pass) {
    //     logger.error("Intterra username or password not set in database");
    //     return;
    // }

    const user_password = await getValue('registry_password');
    // if (!user_password) {
    //     logger.error("Registry password not set in database");
    //     logger.error("not running intterra...")
    //     return;
    // }

    browser = await puppeteer.launch({ headless: config.debug ? false : true });
    // const page = await browser.newPage();
    page = await browser.newPage();

    const client = await page.target().createCDPSession();
    await client.send('Network.enable');

    client.on('Network.webSocketCreated', async ({ requestId, url }) => {
        logger.info(`WebSocket created:`);
        await getCookies(page);
    });

    // NOTE: apparently when the websocket closes, some cookies are refreshed and a new websocket is opened.
    // So as long as we refresh the cookies we are using, we can continue to fetch the incident list.
    client.on('Network.webSocketClosed', ({ requestId, timestamp }) => {
        logger.info(`WebSocket closed.`);
    });

    client.on('Network.webSocketFrameReceived', handleWebSocketFrameReceived);

    // TODO: this doesn't always work without me clicking the link... sometimes.
    // Navigate to the login page
    const navigationPromise = page.waitForNavigation();
    await page.goto(config.URL_LOGIN);
    await navigationPromise;

    await page.waitForSelector('[name="username"]');
    await page.type('[name="username"]', user);
    await page.type('[name="password"]', pass);
    await page.waitForSelector('button.primary');
    await page.click('button.primary');

    /// TODO it's possible to get a sitstat update before this timeout.. therefore we won't have the proper cookies to do an incident list fetch.. HMMMMMM.
    // sleep for 5 seconds
    // await page.waitForTimeout(3000);

    // await getCookies(page);
}


async function handleWebSocketFrameReceived({ requestId, timestamp, response }) {
    const cleanedMessage = response.payloadData.replace(/^\d+/, '');

    // sometimes there are just numbers sent/received.  Typically client sends a 2 and server sends a 3
    if (cleanedMessage === '') {
        // logger.info("WebSocket message received: empty");
        return;
    }

    const data = JSON.parse(cleanedMessage);

    if (data[0] !== 'sitstat') {
        logger.info("WebSocket message received: not sitstat");
        return
    }

    // logger.info("WebSocket sitstat update received...");
    if (config.debug)
        process.stdout.write("...");

    const units = [];

    for (const i of data[1].units) {
        units.push({ unit: i.id, incidentId: i.incidentId, status: i.statusCode, lat: i.latitude, lon: i.longitude, bearing: i.bearing });
    }

    processUnitUpdates(units);
}

// We are keeping the status of every unit and updating it as we receive updates from the websocket
// This way, we can detect when a unit has "changed status" and alert the users of that unit
const unitStatusMap = new Map();

async function processUnitUpdates(updates) {
    const tappedOutUnits = new Set();
    for (const update of updates) {
        const { unit, incidentId, lat, lon } = update;

        // Check if the unit already exists in the unitStatusMap and if the incidentID has changed
        if (unitStatusMap.has(unit) && unitStatusMap.get(unit).incidentId !== incidentId) {
            if (incidentId === null)
                logger.info(`${unit} cleared`);
            else {
                logger.info(`TAPOUT: ${unit} on ${incidentId}`);
                tappedOutUnits.add(unit);
            }
        }

        unitStatusMap.set(unit, { incidentId, lat, lon });
    }


    // THIS DOESN"T WORK BECAUSE SITSTAT DOESN"T SEND A LIST OF EVERY UNIT>.. but over time it will build up.. but whatever...
    // remove units with id's that don't start with 'M'
    // const clearedMedics = [...unitStatusMap.entries()].filter(([unitKey, unitValue]) => unitValue.incidentId !== null && unitKey.startsWith('M') && unitValue.status === 'AV');
    // logger.info(`AMR at level: ${clearedMedics.length}`)

    // Retrieve all users from the database
    const users = await getAllUsers();

    // if there are no users....
    if (!users) {
        logger.warn("No users in database.  Not sending alerts.");
        return;
    }

    // Filter the tappedOutUnits to only include units with registered users
    const tappedOutUnitsWithUsers = new Set(
        [...tappedOutUnits].filter((unit) => users.some((user) => user.unit === unit))
    );

    let incidents = null;
    if (tappedOutUnitsWithUsers.size > 0) {
        await getCookies(page);
        incidents = await getIncidentData();
        if (!incidents) {
            logger.error("Could not get incident data.  This app needs to be restarted.");
            process.exit(1);
        }
        await alertUsersForTappedOutUnits(tappedOutUnitsWithUsers, incidents);
    }
}



async function alertUsersForTappedOutUnits(tappedOutUnits, incidents) {
    // Retrieve all users from the database
    const users = await getAllUsers();

    for (const user of users) {
        const { user_chat_id, unit } = user;

        if (tappedOutUnits.has(unit)) {
            // Get the incidentId for the tapped out unit from the unitStatusMap
            const incidentId = unitStatusMap.get(unit).incidentId;

            // Find the incident in the incidents list by comparing incidentId
            const incident = incidents.find((i) => i.incidentId === incidentId);

            if (!incident) {
                logger.error(`Could not find incident ${incidentId} for unit ${unit}`);
                continue;
            }

            const call = {
                id: incident.id,
                cadCode: incident.cadCode,
                cadDescription: incident.cadDescription,
                address: incident.fullAddress,
                lat: incident.latitude,
                lon: incident.longitude,
                narrative: incident.narrative,
            }

            // Send an alert to the user
            // await bot.telegram.sendMessage(user_chat_id, `⚠️ Your unit ${unit} has been tapped out on incident ${incident.incidentId}!`);
            await tapoutUser(user_chat_id, call)
        }
    }
}





export async function killIntterra() {
    if (browser) {
        logger.info("Closing Intterra browser");
        await browser.close();
    }
}

// export async function restartIntterra() {
//     await killIntterra();
//     await runIntterra();
// }

