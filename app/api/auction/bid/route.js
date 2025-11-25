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
    const auctionId = (body.auctionId || "").trim();
    const userId = (body.userId || "anon").trim();
    const amount = safeInt(body.amount, 0);

    if (!auctionId || !amount) {
      return json({ ok: false, error: "missing_fields" }, 400);
    }

    const key = `auction:${auctionId}`;
    const auction = await redis.get(key);

    if (!auction || auction.status !== "live") {
      return json({ ok: false, error: "auction_closed" }, 400);
    }

    const now = Date.now();
    if (now >= auction.endsAt) {
      // hard close
      auction.status = "ended";
      await redis.set(key, auction);
      await redis.zrem("auctions:live", auctionId);
      return json({ ok: false, error: "auction_ended" }, 400);
    }

    const minBid = auction.currentPrice + auction.minIncrement;
    if (amount < minBid) {
      return json({ ok: false, error: "bid_too_low", minBid }, 400);
    }

    // anti-sniping: si bid dans les 60s finales, +60s
    const remainingMs = auction.endsAt - now;
    let newEndsAt = auction.endsAt;
    if (remainingMs <= 60_000) {
      newEndsAt = auction.endsAt + 60_000;
    }

    const bidId = `bid_${now}_${Math.random().toString(36).slice(2, 7)}`;
    const bid = { id: bidId, auctionId, userId, amount, ts: now };

    // update auction
    const updated = {
      ...auction,
      currentPrice: amount,
      endsAt: newEndsAt,
      bidsCount: (auction.bidsCount || 0) + 1,
      lastBidUserId: userId,
      lastBidAt: now,
    };

    await redis.set(key, updated);

    // save bid log (list)
    await redis.lpush(`bids:${auctionId}`, bid);

    // update index score if endsAt changed
    if (newEndsAt !== auction.endsAt) {
      await redis.zadd("auctions:live", {
        score: newEndsAt,
        member: auctionId,
      });
    }

    return json({ ok: true, auction: updated, bid });
  } catch (e) {
    console.error("auction/bid", e);
    return json({ ok: false, error: "bid_failed" }, 500);
  }
}
