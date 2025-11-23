import { NextResponse } from "next/server";
import { buildAffiliateRedirect } from "../../../../lib/affiliations.js";

export const runtime = "edge";
export const dynamic = "force-dynamic";

function json(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const rawUrl = (searchParams.get("url") || "").trim();

  if (!rawUrl) {
    return json({ ok: false, error: "Missing ?url= parameter" }, 400);
  }

  // Validation URL minimale
  let target;
  try {
    target = new URL(rawUrl);
    if (!/^https?:$/.test(target.protocol)) throw new Error("bad_protocol");
  } catch {
    return json({ ok: false, error: "Invalid url" }, 400);
  }

  try {
    const finalLink = buildAffiliateRedirect(target.toString(), {
      source: "dashboard",
      campaign: "amazon-dashboard",
    });

    return json({
      ok: true,
      original: target.toString(),
      link: finalLink,
      ts: Date.now(),
    });
  } catch (e) {
    return json(
      { ok: false, error: e?.message || "internal-error" },
      500
    );
  }
}
