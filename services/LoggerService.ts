export enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG"
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: string;
}

export class LoggerService {
  private static instance: LoggerService;
  private logs: LogEntry[] = [];
  private readonly maxLogs: number = 1000;

  private constructor() {}

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  private addLog(level: LogLevel, message: string, context?: string) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output for developer feedback with precise clean formatting
    const formattedMessage = `[${new Date(entry.timestamp).toLocaleTimeString()}] [${level}]${context ? ` [${context}]` : ""}: ${message}`;
    switch (level) {
      case LogLevel.INFO:
        console.log(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.DEBUG:
        if (process.env.NODE_ENV !== "production") {
          console.debug(formattedMessage);
        }
        break;
    }
  }

  public info(message: string, context?: string) {
    this.addLog(LogLevel.INFO, message, context);
  }

  public warn(message: string, context?: string) {
    this.addLog(LogLevel.WARN, message, context);
  }

  public error(message: string, context?: string) {
    this.addLog(LogLevel.ERROR, message, context);
  }

  public debug(message: string, context?: string) {
    this.addLog(LogLevel.DEBUG, message, context);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clear() {
    this.logs = [];
  }
}
