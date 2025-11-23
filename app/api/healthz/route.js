// app/api/healthz/route.js
export const runtime = "edge";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET() {
  return json({
    ok: true,
    status: "online",
    env: process.env.VERCEL_ENV || "unknown",
    ts: Date.now(),
    nowISO: new Date().toISOString(),
  });
}

// Optionnel : si un cron/ping POST arrive
export async function POST() {
  return GET();
}
