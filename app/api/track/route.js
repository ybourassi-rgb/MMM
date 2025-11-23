import { NextResponse } from "next/server";
import { buildAffiliateRedirect } from "../../../lib/affiliations.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json; charset=utf-8",
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

  const url = searchParams.get("url");
  const platform = searchParams.get("platform");
  const product = searchParams.get("product"); // gardé pour tracking futur
  const redirect = searchParams.get("redirect");

  // MODE 1 — génération du lien affilié
  if (url) {
    try {
      const finalLink = buildAffiliateRedirect(url, {
        source: "dashboard",
        campaign: "amazon-dashboard",
        platform: platform || undefined,
        product: product || undefined,
      });

      return json({
        ok: true,
        link: finalLink,
        original: url,
        ts: Date.now(),
      });
    } catch (e) {
      console.error("track generate error:", e);
      return json(
        { ok: false, error: e?.message || "internal-error" },
        500
      );
    }
  }

  // MODE 2 — redirection affiliée
  if (platform && redirect) {
    let redirectUrl = redirect;

    try {
      redirectUrl = decodeURIComponent(redirect);
    } catch (e) {
      console.warn("decode redirect error:", e);
    }

    // sécurité minimale
    if (!/^https?:\/\//i.test(redirectUrl)) {
      return json({ ok: false, error: "invalid redirect url" }, 400);
    }

    return NextResponse.redirect(redirectUrl, 302);
  }

  return json(
    { ok: false, error: "Missing ?url= or ?platform=&redirect=" },
    400
  );
}
