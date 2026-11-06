import { NextRequest, NextResponse } from "next/server";
import { sealSession, sessionCookie } from "../../../lib/strava-session";

export async function GET(request: NextRequest) {
  const appUrl = process.env.APP_URL!;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expected = request.cookies.get("strava_oauth_state")?.value;
  if (!code || !state || state !== expected) return NextResponse.redirect(`${appUrl}/?strava=error`);

  const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID!,
      client_secret: process.env.STRAVA_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenResponse.ok) return NextResponse.redirect(`${appUrl}/?strava=error`);
  const token = await tokenResponse.json();
  const sealed = await sealSession({ accessToken: token.access_token, refreshToken: token.refresh_token, expiresAt: token.expires_at, athleteId: token.athlete?.id });
  const response = NextResponse.redirect(`${appUrl}/?strava=connected`);
  response.cookies.set("strava_session", sealed, sessionCookie);
  response.cookies.delete("strava_oauth_state");
  return response;
}
