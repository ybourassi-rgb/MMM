// app/api/fav/route.js
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

// ZSET global : fav_counts
const KEY_FAV = "fav_counts";

// POST { id, title, url, image, category, source }
export async function POST(req) {
  try {
    if (!UP_URL || !UP_TOKEN) {
      return NextResponse.json({ ok: false, error: "Upstash non configuré" }, { status: 400 });
    }

    const body = await req.json();
    const { id, title, url, image, category, source } = body || {};
    if (!id) {
      return NextResponse.json({ ok: false, error: "id manquant" }, { status: 400 });
    }

    // incr fav score
    await upstash("ZINCRBY", [KEY_FAV, 1, id]);

    // stocke mini infos du deal (hash)
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
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "fav error" },
      { status: 500 }
    );
  }
}
