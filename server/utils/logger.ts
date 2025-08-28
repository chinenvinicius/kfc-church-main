import fs from 'node:fs';
import path from 'node:path';

const logDirectory = path.resolve(process.cwd(), 'server/logs');

// Ensure the log directory exists
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

function getLogFilePath(date?: Date): string {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const filename = `app-${year}-${month}-${day}.log`;
  return path.join(logDirectory, filename);
}

function formatLogMessage(level: string, message: string, context?: Record<string, any>): string {
  const timestamp = new Date().toISOString();
  const contextString = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextString}\n`;
}

export function logInfo(message: string, context?: Record<string, any>) {
  const logMessage = formatLogMessage('info', message, context);
  fs.appendFileSync(getLogFilePath(), logMessage);
}

export function logError(message: string, error: Error, context?: Record<string, any>) {
  const errorMessage = error.stack || error.message;
  const logMessage = formatLogMessage('error', `${message}: ${errorMessage}`, context);
  fs.appendFileSync(getLogFilePath(), logMessage);
}