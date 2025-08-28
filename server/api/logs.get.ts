import fs from 'node:fs';
import path from 'node:path';
import { logError } from '~/server/utils/logger';

const logDirectory = path.resolve(process.cwd(), 'server/logs');

export default defineEventHandler(async (event: any) => {
  try {
    const query = getQuery(event);
    const date = query.date as string; // Expected format: YYYY-MM-DD

    if (!date) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Date parameter is required'
      });
    }

    const logFileName = `app-${date}.log`;
    const logFilePath = path.join(logDirectory, logFileName);

    if (!fs.existsSync(logFilePath)) {
      return {
        logs: `Log file for ${date} not found.`,
        error: false
      };
    }

    const logs = fs.readFileSync(logFilePath, 'utf-8');
    return {
      logs: logs,
      error: false
    };
  } catch (error: any) {
    logError('Failed to read log file for date', error, { date: (getQuery(event).date as string) });
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to read log file'
    });
  }
});