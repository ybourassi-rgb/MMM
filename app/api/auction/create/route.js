import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (data, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

function safeInt(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : d;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));

    const title = (body.title || "").trim();
    const description = (body.description || "").trim();
    const images = Array.isArray(body.images) ? body.images.filter(Boolean) : [];
    const category = (body.category || "autre").trim();
    const sellerId = (body.sellerId || "anon").trim();

    const startPrice = safeInt(body.startPrice, 1);
    const minIncrement = safeInt(body.minIncrement, 1);
    const durationHours = safeInt(body.durationHours, 24);
    const reservePrice =
      body.reservePrice == null ? null : safeInt(body.reservePrice, null);

    if (!title || !startPrice || !durationHours) {
      return json({ ok: false, error: "missing_fields" }, 400);
    }

    const id = `auc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const endsAt = Date.now() + durationHours * 3600 * 1000;

    const auctionItem = {
      id,
      type: "auction",
      title,
      description,
      images,
      category,
      sellerId,

      startPrice,
      currentPrice: startPrice,
      minIncrement,
      reservePrice,

      endsAt,
      status: "live",
      bidsCount: 0,
      watchersCount: 0,
      createdAt: Date.now(),
      source: "community-auction",
      bucket: body.bucket || null,
    };

    // store item
    await redis.set(`auction:${id}`, auctionItem);

    // index live auctions
    await redis.zadd("auctions:live", {
      score: endsAt,
      member: id,
    });

    return json({ ok: true, item: auctionItem });
  } catch (e) {
    console.error("auction/create", e);
    return json({ ok: false, error: "create_failed" }, 500);
  }
}
