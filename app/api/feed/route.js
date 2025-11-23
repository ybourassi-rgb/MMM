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

// Dealabs met souvent des miniatures :
// https://static-pepper.dealabs.com/.../re/150x150/qt/55/xxx.jpg
// → on veut l’original :
// https://static-pepper.dealabs.com/.../xxx.jpg
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

// petite util pour extraire une image d’un item RSS
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

function normalizeItem(raw, i = 0, sourceUrl = "") {
  const url = raw.link || raw.url || raw.guid || "";
  const image = pickImage(raw);

  // Tag “voyage” si ça vient d’un flux voyage
  const isTravelSource =
    /voyage|travel|vol|hotel|sejour|vacances/i.test(sourceUrl) ||
    /voyage|travel|vol|hotel|sejour|vacances/i.test(raw.category || "") ||
    /voyage|travel|vol|hotel|sejour|vacances/i.test(raw.title || "");

  return {
    id: raw.id || raw.guid || `${Date.now()}-${i}`,
    title: raw.title?.trim() || "Opportunité",
    url,
    link: raw.link || null,
    image,

    price: raw.price || null,
    score: raw.yscore?.globalScore ?? raw.score ?? null,

    category:
      raw.category ||
      raw.type ||
      (isTravelSource ? "voyage" : "autre"),

    margin: raw.yscore
      ? `${raw.yscore.opportunityScore ?? "—"}%`
      : raw.margin,

    risk: raw.yscore
      ? `${raw.yscore.riskScore ?? "—"}/100`
      : raw.risk,

    horizon: raw.horizon || "court terme",

    halal: raw.yscore
      ? raw.yscore.halalScore >= 80
      : raw.halal ?? null,

    affiliateUrl: raw.affiliateUrl || null,
    source: raw.source || "rss",
    sourceUrl,
    publishedAt: raw.publishedAt || raw.isoDate || null,
    summary: raw.summary || raw.contentSnippet || null,
  };
}

// shuffle simple
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Mélange voyage / autres (1 voyage toutes les 3 cards environ)
function interleaveTravel(items) {
  const travel = items.filter((it) =>
    /voyage|travel|vol|hotel|sejour|vacances/i.test(it.category || "")
  );
  const other = items.filter(
    (it) => !/voyage|travel|vol|hotel|sejour|vacances/i.test(it.category || "")
  );

  const t = shuffle(travel);
  const o = shuffle(other);

  const out = [];
  let ti = 0,
    oi = 0;

  while (ti < t.length || oi < o.length) {
    // 3 autres, 1 voyage
    for (let k = 0; k < 3 && oi < o.length; k++) {
      out.push(o[oi++]);
    }
    if (ti < t.length) out.push(t[ti++]);
  }

  return out;
}

export async function GET() {
  try {
    // ✅ Ajoute petit à petit ici
    const SOURCES = [
      // ---- GENERAL / SHOPPING ----
      "https://www.dealabs.com/rss/hot",
      "https://www.dealabs.com/rss/nouveau",

      // Groupes Dealabs (souvent dispo en RSS)
      "https://www.dealabs.com/groupe/high-tech/rss",
      "https://www.dealabs.com/groupe/maison-jardin/rss",
      "https://www.dealabs.com/groupe/jeux-video/rss",
      "https://www.dealabs.com/groupe/auto-moto/rss",
      "https://www.dealabs.com/groupe/sport-loisirs/rss",

      // ---- VOYAGE ----
      "https://www.dealabs.com/groupe/voyages/rss",
      "https://www.dealabs.com/groupe/vols/rss",
      "https://www.dealabs.com/groupe/hotel/rss",
    ];

    const feeds = await Promise.all(
      SOURCES.map((u) => parser.parseURL(u))
    );

    let items = feeds
      .flatMap((f, idx) =>
        (f.items || []).map((raw, i) =>
          normalizeItem(raw, i, SOURCES[idx])
        )
      )
      .filter((it) => it.url);

    // ✅ Enlève les deals sans image ou image “placeholder”
    items = items.filter((it) => {
      if (!it.image) return false;
      if (it.image.includes("default-") || it.image.endsWith(".svg"))
        return false;
      return true;
    });

    // ✅ Mélange voyage / autres
    items = interleaveTravel(items);

    return NextResponse.json({ ok: true, items, cursor: null });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Feed error", items: [] },
      { status: 500 }
    );
  }
}
