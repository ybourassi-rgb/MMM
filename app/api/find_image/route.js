// app/api/find_image/route.js
// Cherche 1 image via Google Custom Search (Images)

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

// Petite normalisation de requête pour éviter des trucs bizarres
function cleanRef(ref) {
  return String(ref || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120); // limite soft
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
    const ref = cleanRef(searchParams.get("ref"));

    if (!ref) {
      return json({ ok: false, error: "missing_ref", detail: "Missing ?ref=" }, 400);
    }

    const apiUrl =
      "https://www.googleapis.com/customsearch/v1" +
      `?key=${encodeURIComponent(GOOGLE_KEY)}` +
      `&cx=${encodeURIComponent(GOOGLE_CX)}` +
      `&searchType=image` +
      `&num=1` +
      `&safe=active` +
      `&q=${encodeURIComponent(ref)}`;

    const gRes = await fetch(apiUrl, { cache: "no-store" });

    if (!gRes.ok) {
      const txt = await gRes.text().catch(() => "");
      console.error("[find_image] Google error", gRes.status, txt?.slice(0, 200));
      return json(
        { ok: false, error: "google_error", status: gRes.status },
        502
      );
    }

    const data = await gRes.json();
    const item = data?.items?.[0];
    const imageUrl = item?.link || null;

    if (!imageUrl) {
      return json({ ok: false, error: "no_image_found" }, 404);
    }

    return json({
      ok: true,
      imageUrl,
      source: item?.image?.contextLink || null,
      ref,
      ts: Date.now(),
    });
  } catch (err) {
    console.error("[find_image] Internal error", err?.message || err);
    return json({ ok: false, error: "internal_error" }, 500);
  }
}

// Si quelqu’un call POST par erreur
export async function POST() {
  return json({ ok: false, error: "Use GET" }, 405);
}
