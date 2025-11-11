// /api/affiliation_run.js
export const config = { runtime: "edge" };

export default async function handler(req) {
  const url = new URL(req.url);
  const provided = (url.searchParams.get("secret") || "").trim();
  const expected = (process.env.CRON_SECRET || "").trim();

  if (expected && provided !== expected) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 🔹 Ping Railway (ou autre worker) et répond tout de suite
  fetch("https://ton-projet-railway.up.railway.app/runCycle", { method: "POST" })
    .catch(console.error);

  return new Response(JSON.stringify({ ok: true, msg: "Cycle déclenché ✅" }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
