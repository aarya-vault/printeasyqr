/**
 * Centralized logging utility
 * Replaces direct console.log usage with structured logging
 */

export interface LogContext {
  [key: string]: any;
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

class Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = this.getTimestamp();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, context));
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    const errorContext = error ? { 
      ...context, 
      error: error.message || error,
      stack: error.stack 
    } : context;
    console.error(this.formatMessage(LogLevel.ERROR, message, errorContext));
  }

  // Database operation logging
  dbOperation(operation: string, table?: string, context?: LogContext): void {
    this.debug(`DB ${operation}`, { table, ...context });
  }

  // API request logging
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API ${method} ${path}`, context);
  }

  // Authentication logging
  auth(message: string, context?: LogContext): void {
    this.info(`AUTH: ${message}`, context);
  }
}

export const logger = new Logger();
export default logger;