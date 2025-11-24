// app/api/stats/route.js
import { NextResponse } from "next/server";

const UP_URL = process.env.UPSTASH_REST_URL;
const UP_TOKEN = process.env.UPSTASH_REST_TOKEN;

const KEY = "click_logs";

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
      return NextResponse.json({ ok: true, total: 0, byDomain: [] });
    }

    const raw = await upstash("LRANGE", [KEY, 0, 500]); // 500 derniers clics
    const logs = (raw || [])
      .map((x) => {
        try { return JSON.parse(x); } catch { return null; }
      })
      .filter(Boolean);

    const byDomainMap = {};
    for (const l of logs) {
      const d = l.domain || "inconnu";
      byDomainMap[d] = (byDomainMap[d] || 0) + 1;
    }

    const byDomain = Object.entries(byDomainMap)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return NextResponse.json({
      ok: true,
      total: logs.length,
      byDomain,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Stats error" },
      { status: 500 }
    );
  }
}
