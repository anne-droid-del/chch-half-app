import { NextRequest, NextResponse } from "next/server";
import { openSession, sealSession, sessionCookie, StravaSession } from "../../../lib/strava-session";

async function refresh(session: StravaSession) {
  if (session.expiresAt > Math.floor(Date.now() / 1000) + 120) return session;
  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID!,
      client_secret: process.env.STRAVA_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: session.refreshToken,
    }),
  });
  if (!response.ok) throw new Error("refresh failed");
  const token = await response.json();
  return { ...session, accessToken: token.access_token, refreshToken: token.refresh_token, expiresAt: token.expires_at };
}

export async function GET(request: NextRequest) {
  const stored = await openSession(request.cookies.get("strava_session")?.value);
  if (!stored) return NextResponse.json({ connected: false, activities: [] }, { status: 401 });
  try {
    const session = await refresh(stored);
    const after = Math.floor(new Date("2026-01-01T00:00:00Z").getTime() / 1000);
    const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=100`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    if (!response.ok) throw new Error("activities failed");
    const rows = await response.json();
    const activities = rows
      .filter((a: { sport_type?: string; type?: string }) => /run/i.test(a.sport_type || a.type || ""))
      .map((a: Record<string, unknown>) => ({
        id: `strava-${a.id}`,
        date: String(a.start_date_local).slice(0, 10),
        type: "run",
        kind: Number(a.distance) / 1000 >= 8 ? "long" : "easy",
        km: Math.round((Number(a.distance) / 1000) * 100) / 100,
        min: Math.round((Number(a.moving_time) / 60) * 10) / 10,
        avgHr: a.average_heartrate ? Math.round(Number(a.average_heartrate)) : undefined,
        maxHr: a.max_heartrate ? Math.round(Number(a.max_heartrate)) : undefined,
        cad: a.average_cadence ? Math.round(Number(a.average_cadence) * 2) : undefined,
        note: String(a.name || "Strava run"),
      }));
    const result = NextResponse.json({ connected: true, activities, syncedAt: new Date().toISOString() });
    if (session.accessToken !== stored.accessToken) result.cookies.set("strava_session", await sealSession(session), sessionCookie);
    return result;
  } catch {
    return NextResponse.json({ connected: true, activities: [], error: "Strava could not be reached" }, { status: 502 });
  }
}
