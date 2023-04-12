import puppeteer from 'puppeteer';
import fetch from 'node-fetch';

import { getValue, getAllUsers } from './database.js';
import { bot } from './bot.js';


// TODO: the path to the units: https://dc.intterragroup.com/v1/sitstat/data/units
// https://developers.google.com/maps/documentation/urls/get-started


import config from './config.js';

let browser = null;

let cookies = {
    access_token: null,
    refresh_token: null,
    agstoken: null,
}




async function getIncidentData() {
    // console.log("getting incident data... here are the cookies:")
    // console.log(cookies.access_token);
    // console.log(cookies.refresh_token);
    // console.log(cookies.agstoken);

    const incidents = await fetch("https://dc.intterragroup.com/v1/sitstat/data/incidents", {
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
        .catch(err => console.log(err));

    console.log("Intterra: NEW INCIDENT LIST!!!!");
    // console.log(incidents);

    return incidents;
}



// here's the idea...
// this function SOMEHOW listens in on the converstaion between the intterra website and the intterra server
// it grabs the authorization tokens and listens to the websocket for updates
// The websocket seems to send unit data every few seconds.
// This data is just the data about the unit.. GPS location, current call, bearing, etc.  Not totally useful.
// Once the unit I want has a call... I take the saved authorization tokens and make a call to the intterra server for the entire incident list.
// Then I pair that with the unit data to get the call data I want... and sent it to the user.
export async function runIntterra() {
    if (browser) {
        console.log("Intterra is already running");
        return;
    }

    // TODO: if intterra is enbled...

    const user = await getValue('intterra_username');
    const pass = await getValue('intterra_password');
    console.log("user: ", user, " pass: ", pass);
    if (!user || !pass) {
        console.error("Intterra username or password not set in database");
        return;
    }

    browser = await puppeteer.launch({ headless: config.debug ? false : true });
    const page = await browser.newPage();

    const client = await page.target().createCDPSession();
    await client.send('Network.enable');

    client.on('Network.webSocketCreated', ({ requestId, url }) => {
        console.log(`WebSocket created:`);
    });

    client.on('Network.webSocketClosed', ({ requestId, timestamp }) => {
        console.log(`WebSocket closed.`);
    });

    client.on('Network.webSocketFrameReceived', handleWebSocketFrameReceived);

    // TODO: this doesn't always work without me clicking the link... sometimes.
    // Navigate to the login page
    await page.goto('https://apps.intterragroup.com');
    await page.waitForSelector('[name="username"]');

    // Fill in the login form and submit
    await page.type('[name="username"]', user);
    await page.type('[name="password"]', pass);
    // await page.waitForSelector('button.primary');
    // await page.click('button.primary');

    const navigationPromise = page.waitForNavigation();
    await page.click('button.primary');
    await navigationPromise;

    /// TODO it's possible to get a sitstat update before this timeout.. therefore we won't have the proper cookies to do an incident list fetch.. HMMMMMM.
    // sleep for 5 seconds
    await page.waitForTimeout(3000);

    const page_cookies = await page.cookies();
    const at = page_cookies.find(cookie => cookie.name === 'access_token');
    console.log('access_token:', at.value);
    cookies.access_token = at.value;

    const rt = page_cookies.find(cookie => cookie.name === 'refresh_token');
    console.log('refresh_token:', rt.value);
    cookies.refresh_token = rt.value;

    // This token seems to change a few times after login and needs time to "settle"
    const ags = page_cookies.find(cookie => cookie.name === 'agstoken');
    cookies.agstoken = ags.value;
    console.log('agstoken:', cookies.agstoken);
}


async function handleWebSocketFrameReceived({ requestId, timestamp, response }) {
    // console.log(`WebSocket message received: ${response.payloadData}`);
    // console.log("WebSocket message received");
    // console.log(response.payloadData)

    const cleanedMessage = response.payloadData.replace(/^\d+/, '');
    // console.log(cleanedMessage)

    // sometimes there are just numbers sent/received.  Typically client sends a 2 and server sends a 3
    if (cleanedMessage === '') {
        // console.log("WebSocket message received: empty");
        return;
    }

    const data = JSON.parse(cleanedMessage);

    if (data[0] !== 'sitstat') {
        // console.log("WebSocket message received: not sitstat");
        return
    }

    console.log("WebSocket sitstat update received...");

    const units = [];

    for (const i of data[1].units)
        units.push({ unit: i.id, incidentId: i.incidentId, lat: i.latitude, lon: i.longitude, bearing: i.bearing });

    processUnitUpdates(units);
}


const unitStatusMap = new Map();

// async function processUnitUpdates(updates) {

//     const tappedOutUnits = new Set();
//     for (const update of updates) {
//         const { unit, incidentId, lat, lon } = update;

//         // Check if the unit already exists in the unitStatusMap and if the incidentID has changed
//         if (unitStatusMap.has(unit) && unitStatusMap.get(unit).incidentId !== incidentId) {
//             if (incidentId === null)
//                 console.log(`${unit} cleared`);
//             else {
//                 console.log(`TAPOUT: ${unit} on ${incidentId}`);
//                 tappedOutUnits.add(unit);
//             }
//         }

//         unitStatusMap.set(unit, { incidentId, lat, lon });
//     }

//     let incidents = null;
//     if (tappedOutUnits.size > 0) {
//         incidents = await getIncidentData();
//         await alertUsersForTappedOutUnits(tappedOutUnits, incidents);
//     }
// }


async function processUnitUpdates(updates) {
    const tappedOutUnits = new Set();
    for (const update of updates) {
        const { unit, incidentId, lat, lon } = update;

        // Check if the unit already exists in the unitStatusMap and if the incidentID has changed
        if (unitStatusMap.has(unit) && unitStatusMap.get(unit).incidentId !== incidentId) {
            if (incidentId === null)
                console.log(`${unit} cleared`);
            else {
                console.log(`TAPOUT: ${unit} on ${incidentId}`);
                tappedOutUnits.add(unit);
            }
        }

        unitStatusMap.set(unit, { incidentId, lat, lon });
    }

    // Retrieve all users from the database
    const users = await getAllUsers();

    // Filter the tappedOutUnits to only include units with registered users
    const tappedOutUnitsWithUsers = new Set(
        [...tappedOutUnits].filter((unit) => users.some((user) => user.unit === unit))
    );

    let incidents = null;
    if (tappedOutUnitsWithUsers.size > 0) {
        incidents = await getIncidentData();
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
            await alertUser(user_chat_id, call)
        }
    }
}







async function alertUser(chatID, call) {
    console.log("TAPOUT TAPOUT TAPOUT TAPOUT TAPOUT TAPOUT!")

    const google_URL = `https://www.google.com/maps/search/?api=1&query=${call.lat}%2C${call.lon}`
    const where = `\n${call.address}\n\n${google_URL}`
    const what = `\n<b>${call.cadCode} ${call.cadDescription}</b>\n${call.narrative}\n\n`

    const msg = `🚨 🚒💨\n${what}${where}`;

    // I need to lookup the users's ChatID by searching the database for their assigned unit
    // const chatID = await getValue('chat_id');
    await bot.telegram.sendMessage(chatID, msg, { parse_mode: 'HTML' });
}




// export async function restartIntterra() {
//     await killIntterra();
//     await runIntterra();
// }


export async function killIntterra() {
    if (browser) {
        console.log("Closing Intterra browser");
        await browser.close();
    }
}




// TODO
// const myUnit = await getValue('intterra_unit');

// let all_units = [];
// for (const i of units) {
//     all_units.push(i.id);
// }
// console.log(`all_units: ${all_units}`);

// console.log(units)

// for (const u of units) {
//     if (u.id == myUnit) {
//         console.log(`we found ${myUnit}`);

//         if (u.incidentId === null) {
//             console.log(`${myUnit} is not on a call`);
//             return;
//         }

//         if (u.incidentId === currentCallID) {
//             console.log(`${myUnit} update... still on the same call`) //TODO: maybe data changes though...
//             return;
//         }

//         currentCallID = u.incidentId;

//         const callData = await getIncidentData(currentCallID);
//         const call = {
//             id: callData.id,
//             cadCode: callData.cadCode,
//             cadDescription: callData.cadDescription,
//             address: callData.fullAddress,
//             lat: callData.latitude,
//             lon: callData.longitude,
//             narrative: callData.narrative,
//         }

//         alertUser(call);
//     }
// }

