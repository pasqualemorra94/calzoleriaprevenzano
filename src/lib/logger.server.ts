/**
 * Structured Logger — server-only
 *
 * Replaces raw console.error/warn/log with a structured logging interface.
 * Each entry includes: timestamp, level, module context, and message.
 * In production, this should be wired to Sentry, Datadog, or equivalent.
 */

type LogLevel = "error" | "warn" | "info" | "debug";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
}

function formatEntry(entry: LogEntry): string {
  const data = entry.data !== undefined ? ` | ${JSON.stringify(entry.data)}` : "";
  return `[${entry.timestamp}] ${entry.level.toUpperCase()} [${entry.module}] ${entry.message}${data}`;
}

function emit(level: LogLevel, module: string, message: string, data?: unknown): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    module,
    message,
    data,
  };

  const formatted = formatEntry(entry);

  // In production, replace these with a proper logging service (Sentry, Pino, etc.)
  switch (level) {
    case "error":
      console.error(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "info":
      console.info(formatted);
      break;
    case "debug":
      console.debug(formatted);
      break;
  }
}

/**
 * Create a module-scoped logger instance.
 *
 * Usage:
 *   import { createLogger } from "~/lib/logger.server";
 *   const log = createLogger("webhook");
 *   log.error("Failed to record event", { eventId });
 */
export function createLogger(module: string) {
  return {
    error(message: string, data?: unknown) {
      emit("error", module, message, data);
    },
    warn(message: string, data?: unknown) {
      emit("warn", module, message, data);
    },
    info(message: string, data?: unknown) {
      emit("info", module, message, data);
    },
    debug(message: string, data?: unknown) {
      emit("debug", module, message, data);
    },
  };
}
