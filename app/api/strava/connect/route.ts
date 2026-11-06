import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const appUrl = process.env.APP_URL;
  if (!clientId || !appUrl) return NextResponse.json({ error: "Strava is not configured" }, { status: 500 });
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${appUrl}/api/strava/callback`,
    response_type: "code",
    approval_prompt: "auto",
    scope: "read,activity:read_all",
    state,
  });
  const response = NextResponse.redirect(`https://www.strava.com/oauth/authorize?${params}`);
  response.cookies.set("strava_oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 });
  return response;
}
