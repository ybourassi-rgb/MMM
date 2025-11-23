// app/api/mmy-agent-run/route.js
import { runAgent } from "@/mmy-agent/index.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

// 🔒 Bloque toute exécution pendant le build Vercel/Next
function isBuildTime() {
  const phase = process.env.NEXT_PHASE || "";
  // phase-production-build pendant `next build`
  if (phase.includes("production-build")) return true;

  // sécurité Vercel (rare mais utile)
  if (process.env.VERCEL_BUILD_STEP === "1") return true;

  return false;
}

export async function GET() {
  try {
    if (isBuildTime()) {
      console.log("🧱 Build time detected -> skip MMY Agent run");
      return json({ ok: true, skipped: true, reason: "build-time" });
    }

    const res = await runAgent();
    return json(res);
  } catch (e) {
    console.error("[mmy-agent-run]", e);
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
}
