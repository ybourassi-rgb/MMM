// app/api/auctions/bid/route.js
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// ---------- Storage (same logic as /api/auctions) ----------
const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

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

const memStore = globalThis.__LBS_AUCTIONS__ || [];
globalThis.__LBS_AUCTIONS__ = memStore;

const KEY = "lbs:auctions";

const safeStr = (v, max = 160) => String(v || "").trim().slice(0, max);
const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// Find + update auction in Upstash list
async function updateAuctionUpstash(id, updater) {
  const r = await getRedis();
  const list = (await r.lrange(KEY, 0, 500)) || [];

  let found = null;
  const next = list.map((x) => {
    const obj = typeof x === "string" ? JSON.parse(x) : x;
    if (obj?.id === id) {
      found = updater(obj);
      return JSON.stringify(found);
    }
    return typeof x === "string" ? x : JSON.stringify(x);
  });

  if (!found) return null;

  await r.del(KEY);
  if (next.length) await r.lpush(KEY, ...next);
  return found;
}

// Find + update auction in memory list
function updateAuctionMem(id, updater) {
  const idx = memStore.findIndex((a) => a?.id === id);
  if (idx === -1) return null;
  const updated = updater(memStore[idx]);
  memStore[idx] = updated;
  return updated;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = safeStr(body.id);
    const amount = safeNum(body.amount);
    const bidder = safeStr(body.bidder || body.user || "Anonyme");
    const ts = Date.now();

    if (!id || amount == null || amount <= 0) {
      return json({ ok: false, error: "missing_id_or_amount" }, 400);
    }

    const updater = (auction) => {
      const start = safeNum(auction.startingPrice) ?? 0;
      const current = safeNum(auction.currentPrice) ?? start;
      const step = safeNum(auction.bidStep) ?? 1;

      const minValid = current + step;

      if (amount < minValid) {
        const err = `bid_too_low_min_${minValid}`;
        const e = new Error(err);
        e.httpStatus = 400;
        throw e;
      }

      const bids = Array.isArray(auction.bids) ? auction.bids : [];
      bids.push({ amount, bidder, ts });

      return {
        ...auction,
        currentPrice: amount,
        bids: bids.slice(-200),
        updatedAt: ts,
        lastBidder: bidder,
      };
    };

    let updated = null;

    if (hasUpstash) {
      updated = await updateAuctionUpstash(id, updater);
    } else {
      updated = updateAuctionMem(id, updater);
    }

    if (!updated) {
      return json({ ok: false, error: "auction_not_found" }, 404);
    }

    return json({ ok: true, item: updated });
  } catch (e) {
    const status = e.httpStatus || 500;
    return json({ ok: false, error: e.message || "bid_error" }, status);
  }
}
