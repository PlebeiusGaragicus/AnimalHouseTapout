// TODO: I might want these logs to NOT be appended...?  Also... what about 'rolling' the logs.. or cycling..?  Forgot what it's called.

import winston from 'winston';


const consoleFormat = winston.format.printf(({ timestamp, level, message, stack }) => {
    const formattedMessage = stack ? stack : message;
    return `[${timestamp}] ${level}: ${formattedMessage}`;
});

const fileFormat = winston.format.combine(
    winston.format.uncolorize(),
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        consoleFormat
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                consoleFormat
            )
        }),
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



/*
TODO - add log rotation

Rolling logs, also known as log rotation, is a technique used to manage log files. When log files become too large, they are archived or compressed, and a new log file is created to continue logging. This helps keep log files manageable in terms of size, makes it easier to analyze logs, and prevents disk space issues.

Winston does not have built-in support for log rotation, but you can use third-party packages like winston-daily-rotate-file to implement rolling logs.

To get started, you first need to install the winston-daily-rotate-file package:


npm install winston-daily-rotate-file

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

// ...

const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        consoleFormat
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                consoleFormat
            )
        }),
        new DailyRotateFile({
            filename: 'error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            format: fileFormat,
            maxSize: '10m',
            maxFiles: '14d'
        }),
        new DailyRotateFile({
            filename: 'combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            format: fileFormat,
            maxSize: '10m',
            maxFiles: '14d'
        })
    ],
    // ...
});

In this example, I replaced the File transports with DailyRotateFile transports. The configuration options used are:

filename: The filename pattern for the log files. %DATE% will be replaced with the current date based on the datePattern.
datePattern: The date format used in the filename.
maxSize: The maximum size of a log file before it gets archived or compressed. In this example, it's set to 10 MB.
maxFiles: The maximum number of log files to keep before removing the oldest ones. In this example, it's set to 14 days.
With this configuration, the log files will be created daily, and each log file will be named with the current date. Once a log file reaches 10 MB, it will be archived, and a new log file will be created. Logs older than 14 days will be automatically removed.



*/