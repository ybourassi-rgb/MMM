export const runtime = "edge";
export const dynamic = "force-dynamic";

// ---------- Headers communs ----------
function headers() {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    "CDN-Cache-Control": "no-store",
    "Vercel-CDN-Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// ---------- Utils ----------
const UA =
  "Mozilla/5.0 (compatible; MMM-RSSBot/1.2; +https://mmm-alpha-one.vercel.app)";

const MAX_PER_FEED = 50;
const MAX_TOTAL = 120;
const FETCH_TIMEOUT = 6500;

function proxyWrap(url) {
  const u = url.replace(/^https?:\/\//, "");
  return `https://r.jina.ai/http://${u}`;
}

function abortAfter(ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return { ctrl, t };
}

async function safeFetch(url, { timeout = FETCH_TIMEOUT } = {}) {
  // 1) fetch direct
  try {
    const { ctrl, t } = abortAfter(timeout);
    const r = await fetch(url, {
      cache: "no-store",
      headers: { "User-Agent": UA },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (r.ok) return r;
  } catch {}

  // 2) fetch via proxy Jina
  try {
    const { ctrl, t } = abortAfter(timeout);
    const r2 = await fetch(proxyWrap(url), {
      cache: "no-store",
      headers: { "User-Agent": UA },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (r2.ok) return r2;
  } catch {}

  throw new Error("fetch_failed");
}

function cleanText(s = "") {
  return s.replace(/<!\[CDATA\[(.*?)\]\]>/gis, "$1").trim();
}

function toISODate(...candidates) {
  for (const c of candidates) {
    if (!c) continue;
    const d = new Date(c);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

function domainOf(url = "") {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0];
  }
}

// ---------- Parsing RSS / Atom enrichi ----------
function parseRSS(xml, sourceUrl) {
  const items = [];
  const sourceDomain = domainOf(sourceUrl);

  const pickFrom = (block, tag) =>
    cleanText(
      block.match(
        new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")
      )?.[1] ?? ""
    );

  // RSS 2.0: <item>
  const reItem = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m;

  while ((m = reItem.exec(xml))) {
    const block = m[1];

    const title = pickFrom(block, "title");
    const link =
      pickFrom(block, "link") ||
      cleanText(block.match(/<guid\b[^>]*>([\s\S]*?)<\/guid>/i)?.[1] ?? "");

    const pubDate = pickFrom(block, "pubDate");
    const dcDate = pickFrom(block, "dc:date");

    const description =
      pickFrom(block, "description") ||
      pickFrom(block, "content:encoded");

    const mediaContent =
      block.match(/<media:content\b[^>]*url=["']([^"']+)["']/i)?.[1] ?? "";
    const mediaThumb =
      block.match(/<media:thumbnail\b[^>]*url=["']([^"']+)["']/i)?.[1] ?? "";
    const enclosure =
      block.match(/<enclosure\b[^>]*url=["']([^"']+)["']/i)?.[1] ?? "";
    const imgInDesc =
      description.match(/<img\b[^>]*src=["']([^"']+)["']/i)?.[1] ?? "";

    const image = mediaContent || mediaThumb || enclosure || imgInDesc || "";

    if (title || link) {
      items.push({
        id: (link || title || Math.random().toString(36).slice(2)).slice(0, 128),
        title,
        url: link || "",
        source: sourceDomain,
        sourceUrl,
        summary: cleanText(description).replace(/<[^>]+>/g, "").slice(0, 280),
        image,
        updatedAtISO: toISODate(pubDate, dcDate),
      });
    }
  }

  // Atom: <entry>
  const reEntry = /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi;
  while ((m = reEntry.exec(xml))) {
    const block = m[1];

    const title = pickFrom(block, "title");

    // Atom link peut être href ou <link>texte</link>
    const linkHref =
      block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?>/i)?.[1] ??
      pickFrom(block, "link") ??
      "";

    const updated = pickFrom(block, "updated");
    const published = pickFrom(block, "published");
    const summary = pickFrom(block, "summary") || pickFrom(block, "content");

    const mediaContent =
      block.match(/<media:content\b[^>]*url=["']([^"']+)["']/i)?.[1] ?? "";
    const imgInSummary =
      summary.match(/<img\b[^>]*src=["']([^"']+)["']/i)?.[1] ?? "";
    const image = mediaContent || imgInSummary || "";

    if (title || linkHref) {
      items.push({
        id: (linkHref || title || Math.random().toString(36).slice(2)).slice(0, 128),
        title,
        url: linkHref || "",
        source: sourceDomain,
        sourceUrl,
        summary: cleanText(summary).replace(/<[^>]+>/g, "").slice(0, 280),
        image,
        updatedAtISO: toISODate(updated, published),
      });
    }
  }

  return items;
}

// Déduplication par URL puis titre
function dedupe(items) {
  const seenUrl = new Set();
  const seenTitle = new Set();
  const out = [];

  for (const it of items) {
    const keyU = (it.url || "").trim().toLowerCase();
    const keyT = (it.title || "").trim().toLowerCase();

    if (keyU && !seenUrl.has(keyU)) {
      seenUrl.add(keyU);
      out.push(it);
      continue;
    }
    if (!keyU && keyT && !seenTitle.has(keyT)) {
      seenTitle.add(keyT);
      out.push(it);
    }
  }
  return out;
}

function sortByDateDesc(items) {
  return items.sort((a, b) => {
    const da = new Date(a.updatedAtISO).getTime() || 0;
    const db = new Date(b.updatedAtISO).getTime() || 0;
    return db - da;
  });
}

// ---------- Core handler ----------
async function handle(req) {
  try {
    let urls = [];

    if (req.method === "GET") {
      const { searchParams } = new URL(req.url);
      const u = searchParams.get("url");
      if (u) urls = [u];
    } else if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      urls = Array.isArray(body?.urls) ? body.urls : [];
    } else {
      return new Response(
        JSON.stringify({ ok: false, error: "Méthode non autorisée" }),
        { status: 405, headers: headers() }
      );
    }

    if (!urls.length) {
      return new Response(
        JSON.stringify({ ok: false, error: "Aucune URL fournie" }),
        { status: 400, headers: headers() }
      );
    }

    const chunks = await Promise.all(
      urls.filter(Boolean).map(async (url) => {
        try {
          const r = await safeFetch(url);
          const xml = await r.text();
          return parseRSS(xml, url).slice(0, MAX_PER_FEED);
        } catch (e) {
          return [{
            id: `err-${Math.random().toString(36).slice(2)}`,
            title: `Erreur RSS: ${url}`,
            url,
            source: domainOf(url),
            sourceUrl: url,
            updatedAtISO: new Date().toISOString(),
            error: String(e?.message || e) || "fetch_failed",
          }];
        }
      })
    );

    const results = chunks.flat();
    const unique = dedupe(sortByDateDesc(results)).slice(0, MAX_TOTAL);

    return new Response(
      JSON.stringify({
        ok: true,
        count: unique.length,
        serverNowISO: new Date().toISOString(),
        items: unique,
      }),
      { status: 200, headers: headers() }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: String(e?.message || "Erreur interne"),
      }),
      { status: 500, headers: headers() }
    );
  }
}

// ---------- App Router exports ----------
export async function OPTIONS() {
  return new Response(null, { status: 200, headers: headers() });
}

export async function GET(req) {
  return handle(req);
}

export async function POST(req) {
  return handle(req);
}
