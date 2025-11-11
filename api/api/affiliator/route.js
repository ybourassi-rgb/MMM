// app/api/affiliator/route.js
import { runCycle } from "@/lib/affiliator_run.js";

export const runtime = "nodejs";      // Edge => passe en "nodejs" si libs Node
export const dynamic = "force-dynamic";

export async function GET(req) {
  const url = new URL(req.url);
  const provided = (url.searchParams.get("secret") || "").trim();
  const expected = (process.env.CRON_SECRET || "").trim();

  if (expected && provided !== expected) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const result = await runCycle();
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err?.message || "error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
