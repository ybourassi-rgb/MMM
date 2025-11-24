// app/api/publish/route.js
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs"; // évite edge ici (plus stable)

const redis = Redis.fromEnv();

const KEY = "community:deals";
const MAX_ITEMS = 200; // limite pour pas gonfler

function normalizeCommunityDeal(raw) {
  const now = new Date().toISOString();
  return {
    id: raw.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: (raw.title || "Opportunité").trim(),
    url: raw.url || raw.link || "",
    link: raw.url || raw.link || "",
    image: raw.image || null,
    category: raw.category || "autre",
    city: raw.city || null,
    price: raw.price || null,
    score: raw.score || null,
    margin: raw.margin || null,
    risk: raw.risk || null,
    horizon: raw.horizon || "court terme",
    halal: raw.halal ?? null,
    affiliateUrl: raw.affiliateUrl || null,
    summary: raw.summary || null,
    source: "community",
    publishedAt: raw.publishedAt || now,
  };
}

export async function POST(req) {
  try {
    const body = await req.json();

    if (!body?.title || !body?.url) {
      return NextResponse.json(
        { ok: false, error: "Titre et lien obligatoires" },
        { status: 400 }
      );
    }

    const deal = normalizeCommunityDeal(body);

    // push en tête
    await redis.lpush(KEY, deal);
    // trim pour garder MAX_ITEMS
    await redis.ltrim(KEY, 0, MAX_ITEMS - 1);

    return NextResponse.json({ ok: true, item: deal });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Publish error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const items = (await redis.lrange(KEY, 0, MAX_ITEMS - 1)) || [];
    return NextResponse.json({ ok: true, items });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Fetch publish error", items: [] },
      { status: 500 }
    );
  }
}
