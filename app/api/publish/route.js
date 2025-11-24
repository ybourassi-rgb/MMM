// app/api/publish/route.js
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

// ===== anti alcool =====
function isAlcoholText(text = "") {
  const t = text.toLowerCase();
  const bad = [
    "alcool","alcohol","vin","wine","bière","beer","whisky","whiskey",
    "vodka","rhum","rum","gin","champagne","cognac","tequila",
    "aperitif","apéro","spiritueux","liqueur","bourbon","rosé","merlot"
  ];
  return bad.some((k) => t.includes(k));
}

export async function GET() {
  try {
    if (!UP_URL || !UP_TOKEN) {
      return NextResponse.json({ ok: true, items: [] });
    }

    const raw = await upstash("LRANGE", [KEY, 0, 100]);
    const items = (raw || [])
      .map((x) => {
        try { return JSON.parse(x); } catch { return null; }
      })
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
      title,
      url,
      image,
      category,
      city,
      price,
      condition,
      description,
    } = body || {};

    if (!title || !url) {
      return NextResponse.json(
        { ok: false, error: "Titre + lien obligatoires" },
        { status: 400 }
      );
    }

    title = String(title).trim();
    url = String(url).trim();
    image = image?.trim() || null;
    category = category || "autre";
    city = city?.trim() || null;
    price = price?.trim() || null;
    condition = condition || "neuf";
    description = description?.trim() || null;

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    // ✅ image obligatoire
    if (!image) {
      return NextResponse.json(
        { ok: false, error: "Image obligatoire pour publier une annonce." },
        { status: 400 }
      );
    }

    // ✅ filtre alcool
    const textToCheck = `${title} ${category} ${description || ""}`;
    if (isAlcoholText(textToCheck)) {
      return NextResponse.json(
        { ok: false, error: "Annonces alcool refusées." },
        { status: 400 }
      );
    }

    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title,
      url,
      link: url,
      image,
      category,
      city,
      price,
      condition,
      description,
      source: "community",
      publishedAt: new Date().toISOString(),
      summary: null,
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
