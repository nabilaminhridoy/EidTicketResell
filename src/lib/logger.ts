type LogLevel = 'info' | 'warn' | 'error';

interface LogPayload {
  route: string;
  message: string;
  userId?: string;
  meta?: any;
}

class BaseLogger {
  private log(level: LogLevel, payload: LogPayload) {
    const timestamp = new Date().toISOString();
    
    const structuredLog = {
      level,
      timestamp,
      route: payload.route,
      message: payload.message,
      userId: payload.userId,
      meta: payload.meta || {},
    };

    const logString = JSON.stringify(structuredLog);

    switch (level) {
      case 'info':
        console.log(logString);
        break;
      case 'warn':
        console.warn(logString);
        break;
      case 'error':
        console.error(logString);
        break;
    }
  }

  info(payload: LogPayload) {
    this.log('info', payload);
  }

  warn(payload: LogPayload) {
    this.log('warn', payload);
  }

  error(payload: LogPayload) {
    this.log('error', payload);
  }
}

export const logger = new BaseLogger();
