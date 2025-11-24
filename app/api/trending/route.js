// app/api/trending/route.js
import { NextResponse } from "next/server";

const UP_URL = process.env.UPSTASH_REST_URL;
const UP_TOKEN = process.env.UPSTASH_REST_TOKEN;

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

const KEY_CLICKS = "click_counts";
const KEY_FAV = "fav_counts";

export async function GET() {
  try {
    if (!UP_URL || !UP_TOKEN) {
      return NextResponse.json({ ok: true, items: [] });
    }

    // top 80 par clicks
    const topClicks = await upstash("ZREVRANGE", [KEY_CLICKS, 0, 80]);
    // top 80 par fav
    const topFav = await upstash("ZREVRANGE", [KEY_FAV, 0, 80]);

    const ids = Array.from(new Set([...(topClicks || []), ...(topFav || [])])).slice(0, 60);

    const items = [];
    for (const id of ids) {
      const hkey = `deal:${id}`;
      const data = await upstash("HGETALL", [hkey]);
      if (data?.id) {
        items.push(data);
      }
    }

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "trending error", items: [] },
      { status: 500 }
    );
  }
}
