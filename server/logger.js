// TODO: I might want these logs to NOT be appended...?  Also... what about 'rolling' the logs.. or cycling..?  Forgot what it's called.


import winston from 'winston';


const customFormat = winston.format.printf(({ timestamp, level, message, stack }) => {
    const formattedMessage = stack ? stack : message;
    return `[${timestamp}] ${level.toUpperCase()}:\n${formattedMessage}`;
});


const consoleFormat = winston.format.printf(({ timestamp, level, message, stack }) => {
    const formattedMessage = stack ? stack : message;
    return `[${timestamp}] ${level.toUpperCase()}:\n${formattedMessage}`;
});

const fileFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.errors({ stack: true }),
        winston.format.colorize(),
        consoleFormat
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error', format: fileFormat }),
        new winston.transports.File({ filename: 'combined.log', format: fileFormat })
    ],
    exceptionHandlers: [
        new winston.transports.Console({ format: consoleFormat }),
        new winston.transports.File({ filename: 'exceptions.log', format: fileFormat })
    ]
});

export default logger;

