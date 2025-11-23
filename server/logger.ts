import fs from "node:fs";
import path from "node:path";

// Logs directory
const LOG_DIR = path.resolve(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "server.log");

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

interface LogLevel {
  name: string;
  color: string;
}

const LOG_LEVELS: Record<string, LogLevel> = {
  INFO: { name: "INFO", color: "\x1b[36m" },    // Cyan
  ERROR: { name: "ERROR", color: "\x1b[31m" },  // Red
  WARN: { name: "WARN", color: "\x1b[33m" },    // Yellow
  DEBUG: { name: "DEBUG", color: "\x1b[35m" },  // Magenta
  WS: { name: "WS", color: "\x1b[32m" },        // Green
};

const RESET = "\x1b[0m";

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatConsoleLog(level: LogLevel, message: string, source?: string): string {
  const timestamp = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  
  const sourceStr = source ? ` [${source}]` : "";
  return `${timestamp}${sourceStr} [${level.color}${level.name}${RESET}] ${message}`;
}

function formatFileLog(level: LogLevel, message: string, source?: string): string {
  const timestamp = formatTimestamp();
  const sourceStr = source ? ` [${source}]` : "";
  return `${timestamp}${sourceStr} [${level.name}] ${message}`;
}

function writeToFile(level: LogLevel, message: string, source?: string): void {
  try {
    const logLine = formatFileLog(level, message, source);
    fs.appendFileSync(LOG_FILE, logLine + "\n", "utf-8");
  } catch (error) {
    // Silently fail - don't break the app if logging fails
    console.error("Failed to write to log file:", error);
  }
}

export const logger = {
  info: (message: string, source = "express") => {
    const formatted = formatConsoleLog(LOG_LEVELS.INFO, message, source);
    console.log(formatted);
    writeToFile(LOG_LEVELS.INFO, message, source);
  },

  error: (message: string, source = "express", error?: any) => {
    let fullMessage = message;
    if (error?.message) {
      fullMessage += ` | ${error.message}`;
    }
    if (error?.stack) {
      fullMessage += `\n${error.stack}`;
    }
    
    const formatted = formatConsoleLog(LOG_LEVELS.ERROR, fullMessage, source);
    console.error(formatted);
    writeToFile(LOG_LEVELS.ERROR, fullMessage, source);
  },

  warn: (message: string, source = "express") => {
    const formatted = formatConsoleLog(LOG_LEVELS.WARN, message, source);
    console.warn(formatted);
    writeToFile(LOG_LEVELS.WARN, message, source);
  },

  debug: (message: string, source = "express") => {
    const formatted = formatConsoleLog(LOG_LEVELS.DEBUG, message, source);
    console.log(formatted);
    writeToFile(LOG_LEVELS.DEBUG, message, source);
  },

  ws: (message: string, source = "websocket") => {
    const formatted = formatConsoleLog(LOG_LEVELS.WS, message, source);
    console.log(formatted);
    writeToFile(LOG_LEVELS.WS, message, source);
  },

  // For API logs with method/path/status/duration
  api: (method: string, path: string, status: number, duration: number, extra?: string) => {
    let message = `${method} ${path} ${status} in ${duration}ms`;
    if (extra) {
      message += ` :: ${extra}`;
    }
    
    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    
    const formatted = `${timestamp} [${LOG_LEVELS.INFO.color}API${RESET}] ${message}`;
    console.log(formatted);
    writeToFile(LOG_LEVELS.INFO, message, "API");
  },
};

// Export log file path for monitoring
export function getLogFilePath(): string {
  return LOG_FILE;
}

// Optional: Clear old logs on startup if they're too large (> 10MB)
function rotateLogs(): void {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const stats = fs.statSync(LOG_FILE);
      if (stats.size > 10 * 1024 * 1024) { // 10MB
        const timestamp = formatTimestamp();
        const backupFile = path.join(LOG_DIR, `server.${timestamp.replace(/:/g, "-")}.log`);
        fs.renameSync(LOG_FILE, backupFile);
        logger.info("Log file rotated", "logger");
      }
    }
  } catch (error) {
    // Silently fail
  }
}

rotateLogs();
