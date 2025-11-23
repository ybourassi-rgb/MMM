// app/api/mmy-agent-run/route.js
export const runtime = "nodejs"; // surtout pas edge

import { runAgentCycle } from "../../../mmy-agent/index.js";

export async function GET() {
  try {
    await runAgentCycle();
    return Response.json({ ok: true, ran: "mmy-agent" });
  } catch (e) {
    console.error("[mmy-agent-run] error", e);
    return Response.json(
      { ok: false, error: e?.message || "agent error" },
      { status: 500 }
    );
  }
}
