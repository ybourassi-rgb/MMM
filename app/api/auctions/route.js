// app/api/auctions/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ===============================
// Small JSON helper + CORS
// ===============================
function json(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// ===============================
// Storage: Upstash if available
// ===============================
const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

// Lazy import to avoid crash if not installed in dev
let redis = null;
async function getRedis() {
  if (!hasUpstash) return null;
  if (redis) return redis;
  const { Redis } = await import("@upstash/redis");
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  return redis;
}

// Fallback memory store (dev only)
const memStore = globalThis.__LBS_AUCTIONS__ || [];
globalThis.__LBS_AUCTIONS__ = memStore;

const KEY = "lbs:auctions";

// ===============================
// Helpers
// ===============================
function safeStr(v, max = 2000) {
  return String(v || "").trim().slice(0, max);
}

function inferBucket(input = {}) {
  const t = safeStr(input.title, 300).toLowerCase();
  const c = safeStr(input.category, 100).toLowerCase();
  const b = safeStr(input.bucket, 50).toLowerCase();

  if (b) return b;

  if (t.includes("pokemon") || t.includes("carte") || t.includes("collection") || c.includes("collect")) {
    return "lifestyle";
  }
  if (t.includes("voiture") || t.includes("auto") || t.includes("moto")) return "auto";
  if (t.includes("maison") || t.includes("meuble") || t.includes("déco") || t.includes("bricolage")) return "home";
  if (t.includes("iphone") || t.includes("pc") || t.includes("console") || c.includes("tech")) return "tech";
  if (t.includes("appartement") || t.includes("immobilier")) return "immo";
  if (t.includes("voyage") || t.includes("hotel") || t.includes("vol")) return "travel";

  return "other";
}

function normalizeAuction(raw = {}) {
  const now = Date.now();

  const title = safeStr(raw.title, 160) || "Enchère";
  const url = safeStr(raw.url || raw.link, 2000);

  const images = Array.isArray(raw.images)
    ? raw.images.filter(Boolean).slice(0, 6)
    : raw.image
      ? [raw.image]
      : [];

  const startingPrice =
    raw.startingPrice ?? raw.startPrice ?? raw.priceStart ?? null;

  const currentPrice =
    raw.currentPrice ?? raw.priceCurrent ?? startingPrice ?? null;

  const endAt =
    raw.endAt ?? raw.endsAt ?? raw.end_date ?? null;

  const bucket = inferBucket({ ...raw, title });

  return {
    id: raw.id || `auc_${now}_${Math.random().toString(36).slice(2, 8)}`,
    type: "auction",
    title,
    url,
    images,
    image: images[0] || null,

    category: safeStr(raw.category, 80) || "autre",
    bucket,

    startingPrice,
    currentPrice,
    currency: raw.currency || "EUR",
    bidStep: raw.bidStep ?? raw.step ?? null,

    endAt,
    city: safeStr(raw.city, 80) || null,

    summary: safeStr(raw.summary || raw.description, 600) || null,

    seller: safeStr(raw.seller, 120) || null,
    contact: safeStr(raw.contact, 160) || null,

    source: raw.source || "community-auction",
    createdAt: raw.createdAt || now,
    updatedAt: now,
  };
}

// ===============================
// GET: list auctions
// ===============================
export async function GET() {
  try {
    let items = [];

    if (hasUpstash) {
      const r = await getRedis();
      items = (await r.lrange(KEY, 0, 200)) || [];
    } else {
      items = memStore.slice(-200);
    }

    // Keep valid auctions + sort by endAt soonest if present
    items = items
      .map((x) => (typeof x === "string" ? JSON.parse(x) : x))
      .filter(Boolean)
      .sort((a, b) => {
        const ea = a.endAt ? new Date(a.endAt).getTime() : Infinity;
        const eb = b.endAt ? new Date(b.endAt).getTime() : Infinity;
        return ea - eb;
      });

    return json({ ok: true, items });
  } catch (e) {
    console.error("GET /api/auctions error:", e);
    return json({ ok: false, error: e?.message || "auctions_error", items: [] }, 500);
  }
}

// ===============================
// POST: create auction
// ===============================
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));

    if (!body.title || !(body.url || body.link)) {
      return json({ ok: false, error: "missing_title_or_url" }, 400);
    }

    const auction = normalizeAuction(body);

    if (hasUpstash) {
      const r = await getRedis();
      await r.lpush(KEY, JSON.stringify(auction));
      await r.ltrim(KEY, 0, 500); // keep last 500 auctions
    } else {
      memStore.push(auction);
      if (memStore.length > 500) memStore.shift();
    }

    return json({ ok: true, item: auction });
  } catch (e) {
    console.error("POST /api/auctions error:", e);
    return json({ ok: false, error: e?.message || "create_auction_error" }, 500);
  }
}
