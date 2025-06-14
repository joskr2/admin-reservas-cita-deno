/// <reference lib="deno.ns" />

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: unknown;
  requestId?: string | undefined;
  userId?: string | undefined;
  userRole?: string | undefined;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private enableConsole: boolean = true;
  private enableFile: boolean = false;
  private logFile: string = './logs/app.log';

  private constructor() {
    // Configurar nivel de log desde variable de entorno
    const envLogLevel = Deno.env.get('LOG_LEVEL');
    if (envLogLevel) {
      this.logLevel = LogLevel[envLogLevel as keyof typeof LogLevel] ?? LogLevel.INFO;
    }

    // Habilitar logging a archivo en producción
    const envEnableFile = Deno.env.get('LOG_TO_FILE');
    if (envEnableFile === 'true') {
      this.enableFile = true;
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatLogEntry(entry: LogEntry): string {
    const levelName = LogLevel[entry.level];
    const timestamp = entry.timestamp;
    const requestInfo = entry.requestId ? ` [${entry.requestId}]` : '';
    const userInfo = entry.userId ? ` [${entry.userRole}:${entry.userId}]` : '';
    
    let message = `[${timestamp}] ${levelName} [${entry.category}]${requestInfo}${userInfo}: ${entry.message}`;
    
    if (entry.data) {
      message += `\n  Data: ${JSON.stringify(entry.data, null, 2)}`;
    }
    
    return message;
  }

  private async writeToFile(entry: LogEntry): Promise<void> {
    if (!this.enableFile) return;

    try {
      const logMessage = this.formatLogEntry(entry) + '\n';
      await Deno.writeTextFile(this.logFile, logMessage, { append: true });
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private writeToConsole(entry: LogEntry): void {
    if (!this.enableConsole) return;

    const message = this.formatLogEntry(entry);
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message);
        break;
      case LogLevel.INFO:
        console.info(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.ERROR:
        console.error(message);
        break;
    }
  }

  private async log(level: LogLevel, category: string, message: string, data?: unknown, context?: {
    requestId?: string | undefined;
    userId?: string | undefined;
    userRole?: string | undefined;
  }): Promise<void> {
    if (level < this.logLevel) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      requestId: context?.requestId,
      userId: context?.userId,
      userRole: context?.userRole,
    };

    this.writeToConsole(entry);
    await this.writeToFile(entry);
  }

  // Métodos públicos para logging
  public async debug(category: string, message: string, data?: unknown, context?: {
    requestId?: string | undefined;
    userId?: string | undefined;
    userRole?: string | undefined;
  }): Promise<void> {
    await this.log(LogLevel.DEBUG, category, message, data, context);
  }

  public async info(category: string, message: string, data?: unknown, context?: {
    requestId?: string | undefined;
    userId?: string | undefined;
    userRole?: string | undefined;
  }): Promise<void> {
    await this.log(LogLevel.INFO, category, message, data, context);
  }

  public async warn(category: string, message: string, data?: unknown, context?: {
    requestId?: string | undefined;
    userId?: string | undefined;
    userRole?: string | undefined;
  }): Promise<void> {
    await this.log(LogLevel.WARN, category, message, data, context);
  }

  public async error(category: string, message: string, data?: unknown, context?: {
    requestId?: string | undefined;
    userId?: string | undefined;
    userRole?: string | undefined;
  }): Promise<void> {
    await this.log(LogLevel.ERROR, category, message, data, context);
  }

  // Métodos específicos para diferentes tipos de logging
  public async logRequest(req: Request, requestId: string, context?: {
    userId?: string | undefined;
    userRole?: string | undefined;
  }): Promise<void> {
    const url = new URL(req.url);
    await this.info('REQUEST', `${req.method} ${url.pathname}${url.search}`, {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
      userAgent: req.headers.get('user-agent'),
    }, { requestId, ...context });
  }

  public async logResponse(response: Response, requestId: string, duration: number, context?: {
    userId?: string | undefined;
    userRole?: string | undefined;
  }): Promise<void> {
    await this.info('RESPONSE', `${response.status} ${response.statusText} (${duration}ms)`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      duration,
    }, { requestId, ...context });
  }

  public async logFormSubmission(formData: FormData, action: string, method: string, requestId: string, context?: {
    userId?: string | undefined;
    userRole?: string | undefined;
  }): Promise<void> {
    const data: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      // No loggear passwords o datos sensibles
      if (key.toLowerCase().includes('password') || key.toLowerCase().includes('token')) {
        data[key] = '[REDACTED]';
      } else {
        data[key] = value.toString();
      }
    }

    await this.info('FORM_SUBMISSION', `${method} form submitted to ${action}`, {
      action,
      method,
      formData: data,
    }, { requestId, ...context });
  }

  public async logDatabaseOperation(operation: string, table: string, data?: unknown, result?: unknown, requestId?: string, context?: {
    userId?: string | undefined;
    userRole?: string | undefined;
  }): Promise<void> {
    await this.debug('DATABASE', `${operation} on ${table}`, {
      operation,
      table,
      input: data,
      result,
    }, { requestId, ...context });
  }

  public async logAuthentication(action: string, email: string, success: boolean, requestId: string, reason?: string): Promise<void> {
    const level = success ? LogLevel.INFO : LogLevel.WARN;
    await this.log(level, 'AUTH', `${action} for ${email}: ${success ? 'SUCCESS' : 'FAILED'}`, {
      action,
      email,
      success,
      reason,
    }, { requestId, userId: email });
  }

  public async logValidationError(category: string, errors: string[], data?: unknown, requestId?: string, context?: {
    userId?: string | undefined;
    userRole?: string | undefined;
  }): Promise<void> {
    await this.warn('VALIDATION', `Validation failed in ${category}`, {
      category,
      errors,
      input: data,
    }, { requestId, ...context });
  }

  public async logBusinessLogic(category: string, action: string, message: string, data?: unknown, requestId?: string, context?: {
    userId?: string | undefined;
    userRole?: string | undefined;
  }): Promise<void> {
    await this.info('BUSINESS', `${category}: ${action} - ${message}`, {
      category,
      action,
      data,
    }, { requestId, ...context });
  }

  // Configuración
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public setConsoleEnabled(enabled: boolean): void {
    this.enableConsole = enabled;
  }

  public setFileEnabled(enabled: boolean): void {
    this.enableFile = enabled;
  }

  public setLogFile(path: string): void {
    this.logFile = path;
  }
}

// Función de conveniencia para obtener el logger
export const logger = Logger.getInstance();

// Generar ID único para requests
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Utility function for safe error handling
export function getErrorDetails(error: unknown): { message: string; stack?: string | undefined } {
  if (error instanceof Error) {
    const result: { message: string; stack?: string | undefined } = {
      message: error.message,
    };
    if (error.stack) {
      result.stack = error.stack;
    }
    return result;
  }
  
  return {
    message: String(error),
  };
}

// Utility function for safe KV result handling
export function getKvResultDetails(result: Deno.KvCommitResult | Deno.KvCommitError): { 
  ok: boolean; 
  versionstamp?: string | undefined;
} {
  const output: { ok: boolean; versionstamp?: string | undefined } = {
    ok: result.ok,
  };
  
  if (result.ok) {
    output.versionstamp = result.versionstamp;
  }
  
  return output;
}

// Función para extraer información del usuario del contexto
export function extractUserContext(user?: { id?: string; email?: string; role?: string } | null): {
  userId?: string | undefined;
  userRole?: string | undefined;
} {
  if (!user) return {};
  
  const result: { userId?: string | undefined; userRole?: string | undefined } = {};
  
  if (user.id || user.email) {
    result.userId = user.id || user.email;
  }
  
  if (user.role) {
    result.userRole = user.role;
  }
  
  return result;
}