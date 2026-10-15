import assert from "node:assert/strict";
import { after, test } from "node:test";
import {
  createLoginRateLimiter,
  createTeamSessionToken,
  isSameOriginRequest,
  isTeamPasswordConfigured,
  isValidTeamSessionToken,
  teamSessionLifetimeSeconds,
  verifyTeamPassword,
} from "../lib/team-auth.ts";

const originalPassword = process.env.PULSECITY_TEAM_PASSWORD;
const testPassword = "demo-team-password-with-32-chars";
process.env.PULSECITY_TEAM_PASSWORD = testPassword;

after(() => {
  if (originalPassword === undefined) {
    delete process.env.PULSECITY_TEAM_PASSWORD;
  } else {
    process.env.PULSECITY_TEAM_PASSWORD = originalPassword;
  }
});

test("requires a configured password with at least 16 characters and compares safely", () => {
  assert.equal(isTeamPasswordConfigured(), true);
  assert.equal(verifyTeamPassword(testPassword), true);
  assert.equal(verifyTeamPassword("incorrect-password"), false);
  assert.equal(verifyTeamPassword(undefined), false);

  process.env.PULSECITY_TEAM_PASSWORD = "too-short";
  assert.equal(isTeamPasswordConfigured(), false);
  assert.equal(verifyTeamPassword("too-short"), false);
  process.env.PULSECITY_TEAM_PASSWORD = testPassword;
});

test("session signatures expire and become invalid when the password changes", () => {
  const now = Date.now();
  const token = createTeamSessionToken(now);

  assert.equal(isValidTeamSessionToken(token, now), true);
  assert.equal(
    isValidTeamSessionToken(token, now + teamSessionLifetimeSeconds * 1000),
    false
  );
  assert.equal(isValidTeamSessionToken(`${token}x`, now), false);

  process.env.PULSECITY_TEAM_PASSWORD = "a-different-team-password-32chars";
  assert.equal(isValidTeamSessionToken(token, now), false);
  process.env.PULSECITY_TEAM_PASSWORD = testPassword;
});

test("login limiter blocks after the configured failure count and clears after lockout", () => {
  const limiter = createLoginRateLimiter({
    maxFailures: 2,
    windowMs: 1_000,
    lockoutMs: 500,
  });

  limiter.recordFailure(1_000);
  assert.equal(limiter.check(1_100).allowed, true);
  limiter.recordFailure(1_200);
  assert.deepEqual(limiter.check(1_300), {
    allowed: false,
    retryAfterSeconds: 1,
  });
  assert.equal(limiter.check(1_700).allowed, true);
});

test("unsafe requests require a matching same-origin header", () => {
  const request = (origin) => ({
    headers: new Headers(origin ? { origin } : {}),
    nextUrl: new URL("http://localhost:3000/api/team-session"),
  });

  assert.equal(isSameOriginRequest(request("http://localhost:3000")), true);
  assert.equal(isSameOriginRequest(request("https://attacker.example")), false);
  assert.equal(isSameOriginRequest(request(undefined)), false);
});
