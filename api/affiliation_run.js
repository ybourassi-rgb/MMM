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

  try {
    // Import dynamique pour ne pas casser le build Edge
    const { runCycle } = await import("../lib/affiliator_run.js");
    const result = await runCycle();
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      ok: false,
      error: err?.message || String(err)
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
