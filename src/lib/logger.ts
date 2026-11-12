/**
 * SHARKVISION High-Performance Structured Logger
 * 
 * Compliant with production observability standards:
 * - Structured JSON output for centralized ingestion (Datadog, CloudWatch, Logflare)
 * - PII and sensitive data redaction (passwords, tokens, keys, email masks)
 * - Traceable request/session identifiers
 * - Zero external logging dependencies
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  userId?: string;
  role?: string;
  requestId?: string;
  attemptId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  error?: unknown;
  [key: string]: unknown;
}

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "apikey",
  "anonkey",
  "servicekey",
  "service_role_key",
  "access_token",
  "refresh_token",
  "snapshot_correct_answer",
  "correct_answer",
]);

function redactSensitiveData(obj: any, depth = 0): any {
  if (depth > 5 || obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item, depth + 1));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes("password") || lowerKey.includes("secret")) {
      sanitized[key] = "[REDACTED]";
    } else if (lowerKey === "email" && typeof value === "string") {
      // Partial mask for privacy: j***e@domain.com
      const parts = value.split("@");
      if (parts.length === 2 && parts[0].length > 1) {
        sanitized[key] = `${parts[0][0]}***${parts[0][parts[0].length - 1]}@${parts[1]}`;
      } else {
        sanitized[key] = "[REDACTED_EMAIL]";
      }
    } else if (typeof value === "object") {
      sanitized[key] = redactSensitiveData(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function formatLog(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const environment = process.env.NODE_ENV || "development";

  const cleanContext = context ? redactSensitiveData(context) : {};

  // Extract error details if present
  let errorDetails: { message?: string; stack?: string; code?: string } | undefined;
  if (cleanContext.error) {
    const err = cleanContext.error as any;
    errorDetails = {
      message: err.message || String(err),
      stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
      code: err.code,
    };
    delete cleanContext.error;
  }

  const logPayload = {
    timestamp,
    level: level.toUpperCase(),
    environment,
    service: "sharkvision-app",
    message,
    ...cleanContext,
    ...(errorDetails ? { error: errorDetails } : {}),
  };

  const serialized = JSON.stringify(logPayload);

  switch (level) {
    case "error":
      console.error(serialized);
      break;
    case "warn":
      console.warn(serialized);
      break;
    case "debug":
      if (process.env.NODE_ENV !== "production") {
        console.debug(serialized);
      }
      break;
    default:
      console.log(serialized);
      break;
  }
}

export const logger = {
  info(message: string, context?: LogContext) {
    formatLog("info", message, context);
  },
  warn(message: string, context?: LogContext) {
    formatLog("warn", message, context);
  },
  error(message: string, context?: LogContext) {
    formatLog("error", message, context);
  },
  debug(message: string, context?: LogContext) {
    formatLog("debug", message, context);
  },
};
