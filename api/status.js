export const config = { runtime: "edge" };

export default async function handler(req) {
  const headers = {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    "CDN-Cache-Control": "no-store",
    "Vercel-CDN-Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8"
  };

  return new Response(JSON.stringify({
    ok: true,
    status: "online",
    ts: Date.now()
  }), { status: 200, headers });
}
