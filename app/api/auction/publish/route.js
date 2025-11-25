// app/api/auction/publish/route.js
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Upstash (tu l'as déjà configuré dans Vercel)
const redis = Redis.fromEnv();

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
    const items = (await redis.lrange("auction:items", 0, 200)) || [];
    return json({ ok: true, items });
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
    const endAt = body.endAt || null; // ex: timestamp ms ou string
    const description = (body.description || body.summary || "").trim();
    const reservePrice = body.reservePrice ?? null;
    const startingBid = body.startingBid ?? null;

    if (!title || !url) {
      return json({ ok: false, error: "Missing title or url" }, 400);
    }

    const item = {
      id: `auc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: "auction",
      title,
      url,
      image: image || null,
      price: price || null,
      category,
      city: city || null,
      description: description || null,
      reservePrice,
      startingBid,
      endAt,
      source: "auction-premium",
      publishedAt: Date.now(),
      bucket: "general", // tu peux mettre "other" si tu veux séparer
    };

    // push en tête
    await redis.lpush("auction:items", item);

    // garde un max (anti-bloat)
    await redis.ltrim("auction:items", 0, 500);

    return json({ ok: true, item });
  } catch (e) {
    console.error("auction publish error", e);
    return json(
      { ok: false, error: e?.message || "auction_publish_error" },
      500
    );
  }
}
