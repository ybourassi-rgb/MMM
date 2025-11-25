import { NextResponse } from "next/server";

const UP_URL = process.env.UPSTASH_REST_URL;
const UP_TOKEN = process.env.UPSTASH_REST_TOKEN;
const KEY = "community_deals";

async function upstash(cmd, args = []) {
  const res = await fetch(
    `${UP_URL}/${cmd}/${args.map(encodeURIComponent).join("/")}`,
    {
      headers: { Authorization: `Bearer ${UP_TOKEN}` },
      cache: "no-store",
    }
  );
  const data = await res.json();
  return data.result;
}

export async function GET() {
  try {
    if (!UP_URL || !UP_TOKEN) {
      return NextResponse.json({ ok: true, items: [] });
    }

    const raw = await upstash("LRANGE", [KEY, 0, 150]);
    const items = (raw || [])
      .map((x) => { try { return JSON.parse(x); } catch { return null; } })
      .filter(Boolean);

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Publish GET error", items: [] },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    if (!UP_URL || !UP_TOKEN) {
      return NextResponse.json(
        { ok: false, error: "Upstash non configuré" },
        { status: 400 }
      );
    }

    const body = await req.json();
    let {
      sellerName,
      title,
      url,
      image,
      category,
      condition,
      price,
      city,
      description,
      lat,
      lng,
    } = body || {};

    if (!sellerName || !title || !url) {
      return NextResponse.json(
        { ok: false, error: "Pseudo vendeur + titre + lien obligatoires" },
        { status: 400 }
      );
    }

    sellerName = String(sellerName).trim();
    title = String(title).trim();
    url = String(url).trim();
    image = image?.trim() || null;
    category = category || "autre";
    condition = condition || "neuf";
    price = price ? String(price).trim() : null;
    city = city?.trim() || null;
    description = description?.trim() || null;

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    // ✅ bloque deals sans image
    if (!image) {
      return NextResponse.json(
        { ok: false, error: "Image obligatoire pour publier un deal." },
        { status: 400 }
      );
    }

    // ✅ filtre anti-alcool
    const text = `${title} ${category} ${description || ""}`.toLowerCase();
    const bad = [
      "alcool","alcohol","vin","wine","bière","beer","whisky","whiskey",
      "vodka","rhum","rum","gin","champagne","cognac","tequila",
      "aperitif","apéro","spiritueux","liqueur","bourbon",
    ];
    if (bad.some((k) => text.includes(k))) {
      return NextResponse.json(
        { ok: false, error: "Deals alcool refusés." },
        { status: 400 }
      );
    }

    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      sellerName,
      title,
      url,
      link: url,
      image,
      category,
      condition,
      price,
      city,
      description,
      lat: lat ?? null,
      lng: lng ?? null,
      source: "community",
      publishedAt: new Date().toISOString(),
      summary: description || null,
    };

    await upstash("LPUSH", [KEY, JSON.stringify(item)]);
    await upstash("LTRIM", [KEY, 0, 300]);

    return NextResponse.json({ ok: true, item });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Publish POST error" },
      { status: 500 }
    );
  }
}
