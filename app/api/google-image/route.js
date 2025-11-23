// app/api/google-image/route.js
// Retourne une URL d'image via Google Custom Search (Images)

export const runtime = "edge";

const GOOGLE_KEY = process.env.GOOGLE_SEARCH_KEY;
const GOOGLE_CX = process.env.GOOGLE_SEARCH_CX;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function cleanQuery(q) {
  return String(q || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export async function GET(req) {
  try {
    if (!GOOGLE_KEY || !GOOGLE_CX) {
      return json(
        {
          ok: false,
          error: "missing_env",
          detail: "Missing GOOGLE_SEARCH_KEY or GOOGLE_SEARCH_CX",
        },
        500
      );
    }

    const { searchParams } = new URL(req.url);
    const query = cleanQuery(searchParams.get("q") || searchParams.get("query"));

    if (!query) {
      return json(
        { ok: false, error: "missing_query", detail: "Missing q or query" },
        400
      );
    }

    const apiUrl =
      "https://www.googleapis.com/customsearch/v1" +
      `?key=${encodeURIComponent(GOOGLE_KEY)}` +
      `&cx=${encodeURIComponent(GOOGLE_CX)}` +
      `&searchType=image` +
      `&num=1` +
      `&safe=active` +
      `&q=${encodeURIComponent(query)}`;

    const r = await fetch(apiUrl, { cache: "no-store" });

    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      console.error("[google-image] Google error", r.status, txt?.slice(0, 200));
      return json({ ok: false, error: "google_error", status: r.status }, 502);
    }

    const data = await r.json();
    const first = data?.items?.[0];

    return json({
      ok: true,
      image: first?.link || null,
      source: first?.image?.contextLink || null,
      query,
      ts: Date.now(),
    });
  } catch (err) {
    console.error("[google-image] Internal error", err?.message || err);
    return json({ ok: false, error: "google_image_failed" }, 500);
  }
}

export async function POST() {
  return json({ ok: false, error: "Use GET" }, 405);
}
