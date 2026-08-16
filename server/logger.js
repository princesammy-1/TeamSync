/**
 * Structured JSON logging for the TeamSync API.
 *
 * Every entry is a single line of JSON with a stable shape:
 *   { ts, level, message, ...meta }
 *
 * Secrets are redacted from request metadata before they are logged.
 * LOG_LEVEL controls verbosity (debug | info | warn | error), default info.
 *
 * Optional error tracking: set ERROR_REPORTING_URL to POST fatal entries to
 * an external endpoint (e.g. Sentry relay, Datadog, or a custom webhook).
 * The request is fire-and-forget and never blocks the API.
 */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

const SENSITIVE_KEYS = new Set([
  "password",
  "newPassword",
  "currentPassword",
  "token",
  "sessionToken",
  "authorization",
  "cookie",
  "apiKey",
  "secret",
]);

function currentLevel() {
  return LEVELS[String(process.env.LOG_LEVEL ?? "info").toLowerCase()] ?? LEVELS.info;
}

function redact(value, depth = 0) {
  if (depth > 4) return "[redacted:deep]";

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }

  if (value && typeof value === "object") {
    const output = {};
    for (const [key, entry] of Object.entries(value)) {
      const normalized = key.toLowerCase();
      if (SENSITIVE_KEYS.has(normalized)) {
        output[key] = "[redacted]";
      } else if (normalized.endsWith("password") || normalized.endsWith("token")) {
        output[key] = "[redacted]";
      } else {
        output[key] = redact(entry, depth + 1);
      }
    }
    return output;
  }

  return value;
}

function write(level, message, meta) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ? redact(meta) : {}),
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    // eslint-disable-next-line no-console
    console.error(line);
  } else {
    // eslint-disable-next-line no-console
    console.log(line);
  }
}

export function createLogger() {
  const threshold = currentLevel();

  function log(level, message, meta) {
    if (LEVELS[level] < threshold) return;
    write(level, message, meta);
  }

  return {
    debug: (message, meta) => log("debug", message, meta),
    info: (message, meta) => log("info", message, meta),
    warn: (message, meta) => log("warn", message, meta),
    error: (message, meta) => log("error", message, meta),

    /**
     * Express middleware that logs one line per request after the response
     * finishes, with status, latency, and a redacted summary of the body.
     */
    requestLogger() {
      return (req, res, next) => {
        const startedAt = process.hrtime.bigint();
        res.on("finish", () => {
          const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
          const summary = {
            method: req.method,
            path: req.originalUrl || req.url,
            status: res.statusCode,
            durationMs: Math.round(durationMs * 10) / 10,
            ip: req.ip,
          };
          if (req.method !== "GET" && req.body && Object.keys(req.body).length > 0) {
            summary.body = req.body;
          }
          if (res.statusCode >= 500) {
            log("error", "request failed", summary);
          } else if (res.statusCode >= 400) {
            log("warn", "request rejected", summary);
          } else {
            log("info", "request completed", summary);
          }
        });
        next();
      };
    },

    /**
     * Central error handler for Express. Reports to an external endpoint when
     * ERROR_REPORTING_URL is configured, then returns a generic 500 response
     * so internals never leak to clients.
     */
    errorHandler() {
      return (error, req, res, next) => {
        const entry = {
          message: error.message,
          stack: error.stack,
          method: req.method,
          path: req.originalUrl || req.url,
        };
        log("error", "unhandled error", entry);

        const url = process.env.ERROR_REPORTING_URL;
        if (url && res.statusCode === 500) {
          fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(redact(entry)),
          }).catch(() => {
            // Reporting must never take the API down.
          });
        }

        if (res.headersSent) {
          return next(error);
        }
        return res.status(500).json({ message: "Internal server error." });
      };
    },
  };
}