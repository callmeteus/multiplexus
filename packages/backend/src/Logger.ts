import { createLogger, format, transports } from "winston";
import "winston-daily-rotate-file";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const { combine, timestamp, colorize, printf, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
    const base = `${timestamp} [${level}] ${message}`;
    return stack ? `${base}\n${stack}` : base;
});

const sharedRotateOptions = {
    dirname: logsDir,
    datePattern: "YYYY-MM-DD",
    frequency: "1d",       // Rotate every 24h regardless of process uptime
    zippedArchive: true,   // GZIP old files
    maxSize: "20m",        // Also rotate if a single file exceeds 20 MB
    maxFiles: "14d"        // Auto-delete files older than 14 days
};

/**
 * The global logger instance.
 */
export const logger = createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: combine(
        errors({ stack: true }),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        logFormat
    ),
    transports: [
        new transports.Console({
            format: combine(
                colorize({ all: true }),
                errors({ stack: true }),
                timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
                logFormat
            )
        }),
        new transports.DailyRotateFile({
            ...sharedRotateOptions,
            filename: "error-%DATE%.log",
            level: "error"
        }),
        new transports.DailyRotateFile({
            ...sharedRotateOptions,
            filename: "combined-%DATE%.log"
        })
    ]
});

