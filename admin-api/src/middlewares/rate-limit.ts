import type { Request, RequestHandler } from "express";
import { ERROR_CODES } from "../constants/error-codes";
import { ApiError } from "../utils/api-error";

type RateLimitOptions = {
  namespace: string;
  windowMs: number;
  max: number;
  message: string;
  keyBuilder?: (req: Request) => string;
};

type CounterRecord = {
  count: number;
  expiresAt: number;
};

const counters = new Map<string, CounterRecord>();

function cleanupExpiredCounters(now: number) {
  for (const [key, record] of counters.entries()) {
    if (record.expiresAt <= now) {
      counters.delete(key);
    }
  }
}

function getClientIp(req: Request) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0]!.trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return String(forwardedFor[0] || "").trim() || req.ip;
  }

  return req.ip;
}

export function createRateLimit(options: RateLimitOptions): RequestHandler {
  return (req, _res, next) => {
    const now = Date.now();
    cleanupExpiredCounters(now);

    const identity = options.keyBuilder ? options.keyBuilder(req) : getClientIp(req);
    const key = `${options.namespace}:${identity}`;
    const record = counters.get(key);

    if (!record || record.expiresAt <= now) {
      counters.set(key, {
        count: 1,
        expiresAt: now + options.windowMs
      });
      next();
      return;
    }

    if (record.count >= options.max) {
      next(new ApiError(options.message, ERROR_CODES.TOO_MANY_REQUESTS, 429));
      return;
    }

    record.count += 1;
    counters.set(key, record);
    next();
  };
}

export function buildPhoneAndIpKey(req: Request) {
  const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
  return `${getClientIp(req)}:${phone || "anonymous"}`;
}
