// /api/affiliation_run.js
import { runCycle } from "../lib/affiliator_run.js";

export const config = { runtime: "edge" }; // Edge Runtime (rapide et pas de cold start)

export default async function handler(req) {
  try {
    // 1) Vérif du secret
    const url = new URL(req.url);
    const provided = (url.searchParams.get("secret") || "").trim();
    const expected = (process.env.CRON_SECRET || "").trim();

    if (expected && provided !== expected) {
      return new Response(
        JSON.stringify({ ok: false, error: "unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2) Exécuter un cycle d’affiliation
    const result = await runCycle();

    // 3) Réponse OK
    return new Response(
      JSON.stringify({ ok: true, ...result }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    // 4) Gestion d’erreur
    const msg = err?.message || String(err);
    return new Response(
      JSON.stringify({ ok: false, error: msg }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
