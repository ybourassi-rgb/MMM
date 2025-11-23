import { NextResponse } from "next/server";
import { publishTelegram } from "@/lib/telegram_publisher.js";

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
  const url = new URL(req.url);

  // --- sécurité CRON ---
  const provided = (url.searchParams.get("secret") || "").trim();
  const expected = (process.env.CRON_SECRET || "").trim();

  if (expected && provided !== expected) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  try {
    const payload = {
      title: "✅ Test MMM — Telegram OK",
      link: "https://mmm-alpha-one.vercel.app",
      source: "system-test",
    };

    const res = await publishTelegram(payload, "deals");

    return json({ ok: true, sent: true, res, ts: Date.now() });
  } catch (err) {
    console.error("[telegram-test] error:", err);
    return json(
      { ok: false, error: err?.message || String(err), ts: Date.now() },
      500
    );
  }
}
