import winston from 'winston';

const { combine, timestamp, printf, json, colorize } = winston.format;

const simpleFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level}] ${message}${metaStr}`;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp(), simpleFormat),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), simpleFormat),
    }),
    
  ],
});

export default logger;
