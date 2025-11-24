// app/api/log-click/route.js
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

const KEY_CLICKS = "click_counts";     // ZSET global
const KEY_LOGS = "click_logs";        // liste historique

export async function POST(req) {
  try {
    if (!UP_URL || !UP_TOKEN) {
      return NextResponse.json({ ok: true }); // on ne bloque pas
    }

    const body = await req.json();
    const {
      id,
      domain,
      title,
      score,
      category,
      url,
      image,
      source,
    } = body || {};

    if (!id) return NextResponse.json({ ok: true });

    // 1) incr click score
    await upstash("ZINCRBY", [KEY_CLICKS, 1, id]);

    // 2) log brut (option)
    await upstash("LPUSH", [KEY_LOGS, JSON.stringify({
      id, domain, title, score, category, url, at: Date.now()
    })]);
    await upstash("LTRIM", [KEY_LOGS, 0, 1000]);

    // 3) store deal meta (hash)
    const hkey = `deal:${id}`;
    await upstash("HSET", [
      hkey,
      "id", id,
      "title", title || "",
      "url", url || "",
      "image", image || "",
      "category", category || "",
      "source", source || "",
      "updatedAt", new Date().toISOString(),
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
