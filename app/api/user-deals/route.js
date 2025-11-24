// app/api/user-deals/route.js
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const KEY = "user_deals";

export async function POST(req) {
  try {
    const body = await req.json();

    const deal = {
      id: `user-${Date.now()}`,
      title: body.title?.trim() || "Deal utilisateur",
      url: body.url || "",
      image: body.image || null,
      price: body.price || null,
      category: body.category || "annonce",
      city: body.city || null,
      summary: body.summary || null,
      source: "user",
      publishedAt: new Date().toISOString(),
    };

    if (!deal.url) {
      return NextResponse.json({ ok: false, error: "url obligatoire" }, { status: 400 });
    }

    await redis.lpush(KEY, deal);
    await redis.ltrim(KEY, 0, 200); // garde les 200 derniers

    return NextResponse.json({ ok: true, deal });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const deals = (await redis.lrange(KEY, 0, 50)) || [];
    return NextResponse.json({ ok: true, items: deals });
  } catch (e) {
    return NextResponse.json({ ok: false, items: [] }, { status: 500 });
  }
}
