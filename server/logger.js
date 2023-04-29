import winston from 'winston';
import moment from 'moment';
import 'moment-timezone';
// const { Loggly } = require('winston-loggly-bulk');
import { Loggly } from 'winston-loggly-bulk';

import dotenv from 'dotenv';

dotenv.config();
const LOGGLY_CUSTOMER_TOKEN = process.env.LOGGLY_CUSTOMER_TOKEN;
if (LOGGLY_CUSTOMER_TOKEN === undefined) {
    console.log('LOGGLY_CUSTOMER_TOKEN is undefined.  Please set it in your .env file.');
    process.exit(1);
}


const consoleFormat = winston.format.printf(({ timestamp, level, message, stack }) => {
    const formattedMessage = stack ? stack : message;
    return `[${timestamp}] ${level}: ${formattedMessage}`;
});


const localTimeFormat = winston.format((info, opts) => {
    if (opts.tz) {
        info.timestamp = moment().tz(opts.tz).format('YYYY.MM.DD HH:mm:ss');
    } else {
        info.timestamp = moment().format('YYYY.MM.DD HH:mm:ss');
    }
    return info;
});

const fileFormat = winston.format.combine(
    winston.format.uncolorize(),
    // winston.format.timestamp(),
    localTimeFormat(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);


const logglyTransport = new Loggly({
    token: LOGGLY_CUSTOMER_TOKEN,
    subdomain: 'AnimalHouseTap',
    tags: ['Winston-NodeJS'],
    json: true,
});

logglyTransport.on("error", (error) => {
    console.error("Error while sending logs to Loggly:", error);
});


const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        // winston.format.timestamp(),
        // localTimeFormat(),
        localTimeFormat({ tz: 'America/Los_Angeles' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        consoleFormat
    ),
    defaultMeta: { service: 'your-service-name' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                consoleFormat
            )
        }),
        logglyTransport,
        new winston.transports.File({ filename: './logs/error.log', level: 'error', format: fileFormat }),
        new winston.transports.File({ filename: `./logs/errors-${Date.now()}.log`, level: 'error', format: fileFormat, options: { flags: 'w' } }),

        new winston.transports.File({ filename: './logs/all_runs_combined.log', format: fileFormat }),
        new winston.transports.File({ filename: `./logs/run_log-${Date.now()}.log`, format: fileFormat, options: { flags: 'w' } })
    ],
    exceptionHandlers: [
        new winston.transports.Console({ format: consoleFormat }),
        new winston.transports.File({ filename: './logs/exceptions.log', format: fileFormat })
    ]
});


export default logger;
