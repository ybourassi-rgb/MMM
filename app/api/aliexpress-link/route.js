import { NextResponse } from "next/server";

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
    return json({ ok: false, error: "Missing ?url=" }, 400);
  }

  // Validation URL minimale
  let target;
  try {
    target = new URL(rawUrl);
    if (!/^https?:$/.test(target.protocol)) throw new Error("bad_protocol");
  } catch {
    return json({ ok: false, error: "Invalid url" }, 400);
  }

  const appKey = (process.env.ALIX_APPKEY || "").trim();
  const trackingId = (process.env.ALIX_TRACKING || "").trim();

  if (!appKey || !trackingId) {
    return json(
      {
        ok: false,
        error: "Missing ALIX_APPKEY or ALIX_TRACKING env vars",
      },
      500
    );
  }

  const apiUrl =
    "https://api.aliexpress.com/api/link/generate" +
    `?app_key=${encodeURIComponent(appKey)}` +
    `&tracking_id=${encodeURIComponent(trackingId)}` +
    `&url=${encodeURIComponent(target.toString())}`;

  try {
    const response = await fetch(apiUrl, { cache: "no-store" });

    if (!response.ok) {
      const txt = await response.text().catch(() => "");
      return json(
        {
          ok: false,
          error: "aliexpress_api_error",
          status: response.status,
          raw: txt.slice(0, 200),
        },
        502
      );
    }

    const data = await response.json().catch(() => ({}));
    const affiliated =
      data?.data?.promotion_link ||
      data?.promotion_link ||
      null;

    if (!affiliated) {
      return json(
        {
          ok: false,
          error: "no_promotion_link",
          original: target.toString(),
        },
        404
      );
    }

    return json({
      ok: true,
      original: target.toString(),
      affiliated,
      ts: Date.now(),
    });
  } catch (err) {
    console.error("[aliexpress-link] error:", err);
    return json(
      { ok: false, error: "Erreur génération AliExpress" },
      500
    );
  }
}
