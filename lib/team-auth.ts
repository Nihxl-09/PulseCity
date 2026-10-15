import { createHmac, timingSafeEqual } from "node:crypto";

export const teamSessionCookieName = "pulsecity-team-session";
export const teamSessionLifetimeSeconds = 12 * 60 * 60;

function teamPassword(): string | null {
  const password = process.env.PULSECITY_TEAM_PASSWORD;
  return typeof password === "string" && password.length >= 16 ? password : null;
}

function sign(value: string, password: string): Buffer {
  return createHmac("sha256", password).update(value).digest();
}

export function isTeamPasswordConfigured(): boolean {
  return teamPassword() !== null;
}

export function verifyTeamPassword(candidate: unknown): boolean {
  const configuredPassword = teamPassword();
  if (!configuredPassword || typeof candidate !== "string") return false;

  const expected = sign("pulsecity-password-check", configuredPassword);
  const actual = sign("pulsecity-password-check", candidate);
  return timingSafeEqual(expected, actual);
}

export function createTeamSessionToken(now = Date.now()): string {
  const password = teamPassword();
  if (!password) throw new Error("PULSECITY_TEAM_PASSWORD must contain at least 16 characters.");

  const issuedAt = Math.floor(now / 1000);
  const signature = sign(`pulsecity-session:${issuedAt}`, password).toString("hex");
  return `${issuedAt}.${signature}`;
}

export function isValidTeamSessionToken(token: unknown, now = Date.now()): boolean {
  const password = teamPassword();
  if (!password || typeof token !== "string") return false;

  const match = /^(\d{10})\.([a-f\d]{64})$/.exec(token);
  if (!match) return false;

  const issuedAt = Number(match[1]);
  const nowSeconds = Math.floor(now / 1000);
  if (
    issuedAt > nowSeconds + 60 ||
    nowSeconds - issuedAt >= teamSessionLifetimeSeconds
  ) {
    return false;
  }

  const expected = sign(`pulsecity-session:${issuedAt}`, password);
  const actual = Buffer.from(match[2], "hex");
  return timingSafeEqual(expected, actual);
}

export function isSameOriginRequest(
  request: Pick<Request, "headers"> & { nextUrl: URL }
): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

export function createLoginRateLimiter({
  maxFailures = 5,
  windowMs = 15 * 60 * 1000,
  lockoutMs = 15 * 60 * 1000,
}: {
  maxFailures?: number;
  windowMs?: number;
  lockoutMs?: number;
} = {}) {
  let failures: number[] = [];
  let blockedUntil = 0;

  return {
    check(now = Date.now()) {
      if (blockedUntil > now) {
        return { allowed: false, retryAfterSeconds: Math.ceil((blockedUntil - now) / 1000) };
      }
      if (blockedUntil) {
        blockedUntil = 0;
        failures = [];
      }
      failures = failures.filter((timestamp) => now - timestamp < windowMs);
      return { allowed: true, retryAfterSeconds: 0 };
    },
    recordFailure(now = Date.now()) {
      failures = failures.filter((timestamp) => now - timestamp < windowMs);
      failures.push(now);
      if (failures.length >= maxFailures) {
        blockedUntil = now + lockoutMs;
      }
    },
    clear() {
      failures = [];
      blockedUntil = 0;
    },
  };
}
