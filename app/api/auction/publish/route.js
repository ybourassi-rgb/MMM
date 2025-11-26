// app/api/auction/publish/route.js
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const redis = Redis.fromEnv();
const KEY = "lbs:auctions";

function json(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

// GET = liste des enchères
export async function GET() {
  try {
    const items = (await redis.lrange(KEY, 0, 200)) || [];
    const parsed = items
      .map((x) => (typeof x === "string" ? JSON.parse(x) : x))
      .filter(Boolean);
    return json({ ok: true, items: parsed });
  } catch (e) {
    return json(
      { ok: false, error: e?.message || "auction_list_error", items: [] },
      500
    );
  }
}

// POST = publier une enchère
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));

    const title = (body.title || "").trim();
    const url = (body.url || body.link || "").trim();
    const image = (body.image || "").trim();
    const price = (body.price || "").toString().trim();
    const category = (body.category || "enchere").trim();
    const city = (body.city || "").trim();
    const endAt = body.endAt || null;
    const description = (body.description || body.summary || "").trim();
    const reservePrice = body.reservePrice ?? null;
    const startingBid = body.startingBid ?? body.startingPrice ?? null;

    if (!title || !url) {
      return json({ ok: false, error: "Missing title or url" }, 400);
    }

    const item = {
      id: `auc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: "auction",
      auction: true,                 // ✅ important pour DealSlide
      title,
      url,
      image: image || null,
      category,
      city: city || null,
      summary: description || null,
      reservePrice,
      startingBid,
      currentBid: startingBid,        // ✅ init
      endAt,
      source: "community-auction",
      publishedAt: Date.now(),
      bucket: body.bucket || "general",
      bidCount: 0,
    };

    await redis.lpush(KEY, JSON.stringify(item));
    await redis.ltrim(KEY, 0, 500);

    return json({ ok: true, item });
  } catch (e) {
    console.error("auction publish error", e);
    return json(
      { ok: false, error: e?.message || "auction_publish_error" },
      500
    );
  }
}
