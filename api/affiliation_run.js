// /api/affiliation_run.js
import { runCycle } from "../lib/affiliator_run.js";

export const config = { runtime: "edge" };

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const provided = (url.searchParams.get("secret") || "").trim();
    const expected = (process.env.CRON_SECRET || "").trim();

    if (expected && provided !== expected) {
      return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const result = await runCycle();

    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    const msg = err?.message || String(err);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
