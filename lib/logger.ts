/// <reference lib="deno.ns" />

export interface LogEntry {
  timestamp: string;
  category: string;
  message: string;
  data?: unknown;
  requestId?: string | undefined;
  userId?: string | undefined;
  userRole?: string | undefined;
}

export class Logger {
  private static instance: Logger;
  private enableConsole: boolean = true;

  private constructor() {
    // Simple constructor without environment dependencies
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp;
    const requestInfo = entry.requestId ? ` [${entry.requestId}]` : "";
    const userInfo = entry.userId ? ` [${entry.userRole}:${entry.userId}]` : "";

    let message =
      `[${timestamp}] [${entry.category}]${requestInfo}${userInfo}: ${entry.message}`;

    if (entry.data) {
      message += `\n  Data: ${JSON.stringify(entry.data, null, 2)}`;
    }

    return message;
  }

  private writeToConsole(entry: LogEntry): void {
    if (!this.enableConsole) return;

    const message = this.formatLogEntry(entry);
    console.log(message);
  }

  private log(
    category: string,
    message: string,
    data?: unknown,
    context?: {
      requestId?: string | undefined;
      userId?: string | undefined;
      userRole?: string | undefined;
    },
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      category,
      message,
      data,
      requestId: context?.requestId,
      userId: context?.userId,
      userRole: context?.userRole,
    };

    this.writeToConsole(entry);
  }

  // Métodos públicos para logging (ahora síncronos)
  public debug(
    category: string,
    message: string,
    data?: unknown,
    context?: {
      requestId?: string | undefined;
      userId?: string | undefined;
      userRole?: string | undefined;
    },
  ): void {
    this.log(category, `[DEBUG] ${message}`, data, context);
  }

  public info(
    category: string,
    message: string,
    data?: unknown,
    context?: {
      requestId?: string | undefined;
      userId?: string | undefined;
      userRole?: string | undefined;
    },
  ): void {
    this.log(category, `[INFO] ${message}`, data, context);
  }

  public warn(
    category: string,
    message: string,
    data?: unknown,
    context?: {
      requestId?: string | undefined;
      userId?: string | undefined;
      userRole?: string | undefined;
    },
  ): void {
    this.log(category, `[WARN] ${message}`, data, context);
  }

  public error(
    category: string,
    message: string,
    data?: unknown,
    context?: {
      requestId?: string | undefined;
      userId?: string | undefined;
      userRole?: string | undefined;
    },
  ): void {
    this.log(category, `[ERROR] ${message}`, data, context);
  }

  // Métodos específicos para diferentes tipos de logging
  public logRequest(req: Request, requestId: string, context?: {
    userId?: string | undefined;
    userRole?: string | undefined;
  }): void {
    const url = new URL(req.url);
    this.info("REQUEST", `${req.method} ${url.pathname}${url.search}`, {
      method: req.method,
      url: req.url,
      userAgent: req.headers.get("user-agent"),
    }, { requestId, ...context });
  }

  public logResponse(
    response: Response,
    requestId: string,
    duration: number,
    context?: {
      userId?: string | undefined;
      userRole?: string | undefined;
    },
  ): void {
    this.info(
      "RESPONSE",
      `${response.status} ${response.statusText} (${duration}ms)`,
      {
        status: response.status,
        statusText: response.statusText,
        duration,
      },
      { requestId, ...context },
    );
  }

  public logFormSubmission(
    formData: FormData,
    action: string,
    method: string,
    requestId: string,
    context?: {
      userId?: string | undefined;
      userRole?: string | undefined;
    },
  ): void {
    const data: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      // No loggear passwords o datos sensibles
      if (
        key.toLowerCase().includes("password") ||
        key.toLowerCase().includes("token")
      ) {
        data[key] = "[REDACTED]";
      } else {
        data[key] = value.toString();
      }
    }

    this.info(
      "FORM_SUBMISSION",
      `${method} form submitted to ${action}`,
      {
        action,
        method,
        formData: data,
      },
      { requestId, ...context },
    );
  }

  public logDatabaseOperation(
    operation: string,
    table: string,
    data?: unknown,
    result?: unknown,
    requestId?: string,
    context?: {
      userId?: string | undefined;
      userRole?: string | undefined;
    },
  ): void {
    this.debug("DATABASE", `${operation} on ${table}`, {
      operation,
      table,
      input: data,
      result,
    }, { requestId, ...context });
  }

  public logAuthentication(
    action: string,
    email: string,
    success: boolean,
    requestId: string,
    reason?: string,
  ): void {
    const level = success ? "INFO" : "WARN";
    this.log(
      "AUTH",
      `[${level}] ${action} for ${email}: ${success ? "SUCCESS" : "FAILED"}`,
      {
        action,
        email,
        success,
        reason,
      },
      { requestId, userId: email },
    );
  }

  public logValidationError(
    category: string,
    errors: string[],
    data?: unknown,
    requestId?: string,
    context?: {
      userId?: string | undefined;
      userRole?: string | undefined;
    },
  ): void {
    this.warn("VALIDATION", `Validation failed in ${category}`, {
      category,
      errors,
      input: data,
    }, { requestId, ...context });
  }

  public logBusinessLogic(
    category: string,
    action: string,
    message: string,
    data?: unknown,
    requestId?: string,
    context?: {
      userId?: string | undefined;
      userRole?: string | undefined;
    },
  ): void {
    this.info("BUSINESS", `${category}: ${action} - ${message}`, {
      category,
      action,
      data,
    }, { requestId, ...context });
  }

  // Configuración
  public setConsoleEnabled(enabled: boolean): void {
    this.enableConsole = enabled;
  }
}

// Función de conveniencia para obtener el logger
export const logger = Logger.getInstance();

// Generar ID único para requests
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Utility function for safe error handling
export function getErrorDetails(
  error: unknown,
): { message: string; stack?: string | undefined } {
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
export function getKvResultDetails(
  result: Deno.KvCommitResult | Deno.KvCommitError,
): {
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
export function extractUserContext(
  user?: { id?: string; email?: string; role?: string } | null,
): {
  userId?: string | undefined;
  userRole?: string | undefined;
} {
  if (!user) return {};

  const result: { userId?: string | undefined; userRole?: string | undefined } =
    {};

  if (user.id || user.email) {
    result.userId = user.id || user.email;
  }

  if (user.role) {
    result.userRole = user.role;
  }

  return result;
}