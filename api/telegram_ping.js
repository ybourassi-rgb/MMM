export const config = { runtime: "edge" };

export default async function handler(req) {
  const url = new URL(req.url);
  const provided = (url.searchParams.get("secret") || "").trim();
  const expected = (process.env.CRON_SECRET || "").trim();
  if (expected && provided !== expected) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { publishTelegram } = await import("../lib/telegram_publisher.js");
    const res = await publishTelegram(
      { title: "✅ Test MMM — Telegram OK", link: "https://mmm-alpha-one.vercel.app" },
      "deals"
    );
    return new Response(JSON.stringify({ ok: true, res }), {
      status: 200, headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err?.message || String(err) }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}
