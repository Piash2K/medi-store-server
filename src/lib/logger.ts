/**
 * Logger utility for application-wide logging
 * Supports console and file logging with different levels
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatLogLevel(level: LogLevel): string {
    const colors: Record<LogLevel, string> = {
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m',  // Green
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';
    return `${colors[level]}[${level}]${reset}`;
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = this.formatTimestamp();
    const levelStr = this.formatLogLevel(level);
    const dataStr = data ? `\n${JSON.stringify(data, null, 2)}` : '';
    return `${timestamp} ${levelStr} ${message}${dataStr}`;
  }

  public debug(message: string, data?: unknown): void {
    console.log(this.formatMessage('DEBUG', message, data));
  }

  public info(message: string, data?: unknown): void {
    console.log(this.formatMessage('INFO', message, data));
  }

  public warn(message: string, data?: unknown): void {
    console.warn(this.formatMessage('WARN', message, data));
  }

  public error(message: string, data?: unknown | Error): void {
    if (data instanceof Error) {
      console.error(this.formatMessage('ERROR', message, {
        message: data.message,
        stack: data.stack,
      }));
    } else {
      console.error(this.formatMessage('ERROR', message, data));
    }
  }
}

export const logger = new Logger();
