import { logInfo, logError } from '~/server/utils/logger';

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event);
  const url = getRequestURL(event);
  const method = getMethod(event);

  if (url.pathname.startsWith('/api')) {
    logInfo(`API Request: ${method} ${url.pathname}`, { ip, method, path: url.pathname });

    // Log errors for API requests
    event.context.onerror = (error: Error) => {
      logError(`API Error: ${method} ${url.pathname}`, error, { ip, method, path: url.pathname });
    };
  }
});