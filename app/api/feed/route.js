// app/api/feed/route.js
import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["enclosure", "enclosure"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

// ==============================
// Utils Images
// ==============================

function upgradeDealabsImage(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    if (u.hostname.includes("static-pepper.dealabs.com")) {
      u.pathname = u.pathname.replace(/\/re\/\d+x\d+\/qt\/\d+\//i, "/");
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}

function pickImage(it) {
  const mc = it.mediaContent;
  if (mc?.$?.url) return upgradeDealabsImage(mc.$.url);
  if (Array.isArray(mc) && mc[0]?.$?.url)
    return upgradeDealabsImage(mc[0].$?.url);

  if (it.enclosure?.url) return upgradeDealabsImage(it.enclosure.url);

  const html = it.contentEncoded || it.content || "";
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match?.[1]) return upgradeDealabsImage(match[1]);

  return null;
}

// ❌ images “fake/placeholder” connues
function isBlacklistedImage(url = "") {
  const u = url.toLowerCase();

  return (
    u.includes("default-voucher") ||      // Dealabs bons de reduc
    u.includes("default-thread") ||       // Dealabs image par défaut
    u.includes("no-image") ||
    u.endsWith(".svg") ||                // souvent placeholder
    u.includes("spacer") ||
    u.includes("blank")
  );
}

// ✅ check rapide si l’image existe vraiment (HEAD)
async function imageExists(url, timeoutMs = 2500) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: ac.signal,
      cache: "no-store",
    });
    if (!res.ok) return false;

    const ct = res.headers.get("content-type") || "";
    return ct.startsWith("image/");
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

// Petit shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Fetch RSS avec timeout
async function parseWithTimeout(url, timeoutMs = 8000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: ac.signal,
      headers: { "User-Agent": "MMM-FeedBot/1.0" },
      cache: "no-store",
    });
    const xml = await res.text();
    return await parser.parseString(xml);
  } finally {
    clearTimeout(t);
  }
}

// Normalisation item
function normalizeItem(raw, i = 0, sourceName = "rss") {
  const url = raw.link || raw.url || raw.guid || "";
  const image = pickImage(raw);

  return {
    id: raw.id || raw.guid || `${Date.now()}-${i}`,
    title: raw.title?.trim() || "Opportunité",
    url,
    link: raw.link || null,
    image,
    price: raw.price || null,
    score: raw.yscore?.globalScore ?? raw.score ?? null,
    category: raw.category || raw.type || "autre",
    horizon: raw.horizon || "court terme",
    halal: raw.yscore ? raw.yscore.halalScore >= 80 : raw.halal ?? null,
    affiliateUrl: raw.affiliateUrl || null,
    source: sourceName,
    publishedAt: raw.publishedAt || raw.isoDate || null,
    summary: raw.summary || raw.contentSnippet || null,
  };
}

export async function GET() {
  try {
    const SOURCES = [
      { name: "dealabs-hot", url: "https://www.dealabs.com/rss/hot" },
      { name: "dealabs-new", url: "https://www.dealabs.com/rss/nouveau" },
      { name: "hotukdeals", url: "https://www.hotukdeals.com/rss/hot" },
      { name: "mydealz", url: "https://www.mydealz.de/rss/hot" },

      { name: "voyage-dealabs", url: "https://www.dealabs.com/groupe/voyages/rss" },
      { name: "secretflying", url: "https://www.secretflying.com/feed/" },

      { name: "leboncoin-auto", url: "https://www.leboncoin.fr/rss/voitures.xml" },
      { name: "leboncoin-immo", url: "https://www.leboncoin.fr/rss/locations.xml" },
    ];

    const feeds = await Promise.allSettled(
      SOURCES.map(async (s) => {
        const f = await parseWithTimeout(s.url, 8000);
        return { source: s.name, items: f.items || [] };
      })
    );

    let items = feeds
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) =>
        r.value.items.map((it, i) => normalizeItem(it, i, r.value.source))
      );

    // ✅ 1) garde seulement URL + image non blacklistée
    items = items.filter((it) => it.url && it.image && !isBlacklistedImage(it.image));

    // ✅ 2) vérifie vraiment que l’image existe (on limite à 25 checks pour pas ralentir)
    const checked = [];
    for (const it of items) {
      if (checked.length >= 25) break;
      checked.push(it);
    }

    const existsMap = await Promise.all(
      checked.map((it) => imageExists(it.image))
    );

    const okSet = new Set(
      checked.filter((_, idx) => existsMap[idx]).map((x) => x.id)
    );

    // On garde tous ceux non checkés + ceux checkés OK
    items = items.filter((it) => !okSet.size || okSet.has(it.id) || !checked.find(c => c.id === it.id));

    // Mélange final
    items = shuffle(items);

    return NextResponse.json({ ok: true, items, cursor: null });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Feed error", items: [] },
      { status: 500 }
    );
  }
}
