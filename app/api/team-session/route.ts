import { NextRequest, NextResponse } from "next/server";
import {
  createLoginRateLimiter,
  createTeamSessionToken,
  isSameOriginRequest,
  isTeamPasswordConfigured,
  isValidTeamSessionToken,
  teamSessionCookieName,
  teamSessionLifetimeSeconds,
  verifyTeamPassword,
} from "@/lib/team-auth";

const loginRateLimiter = createLoginRateLimiter();

function getSessionCookieOptions(request: NextRequest) {
  return {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "strict" as const,
    path: "/",
    maxAge: teamSessionLifetimeSeconds,
  };
}

export async function GET(request: NextRequest) {
  const configured = isTeamPasswordConfigured();
  return NextResponse.json(
    {
      configured,
      authenticated:
        configured &&
        isValidTeamSessionToken(request.cookies.get(teamSessionCookieName)?.value),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  if (!isTeamPasswordConfigured()) {
    return NextResponse.json(
      { error: "Team access is not configured. Set PULSECITY_TEAM_PASSWORD to at least 16 characters." },
      { status: 503 }
    );
  }

  const rateLimit = loginRateLimiter.check();
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many failed sign-in attempts. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 2_048) {
    return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 2_048) {
      return NextResponse.json({ error: "Request body is too large." }, { status: 413 });
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const password =
    typeof body === "object" && body !== null && "password" in body
      ? body.password
      : undefined;
  if (!verifyTeamPassword(password)) {
    loginRateLimiter.recordFailure();
    return NextResponse.json(
      { error: "The team password is incorrect." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  loginRateLimiter.clear();
  const response = NextResponse.json(
    { authenticated: true },
    { headers: { "Cache-Control": "no-store" } }
  );
  response.cookies.set(
    teamSessionCookieName,
    createTeamSessionToken(),
    getSessionCookieOptions(request)
  );
  return response;
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  const response = NextResponse.json(
    { authenticated: false },
    { headers: { "Cache-Control": "no-store" } }
  );
  response.cookies.set(teamSessionCookieName, "", {
    ...getSessionCookieOptions(request),
    maxAge: 0,
  });
  return response;
}
