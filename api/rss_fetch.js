// /api/rss_fetch.js
export const config = { runtime: "edge" };

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
  "Mozilla/5.0 (compatible; MMM-RSSBot/1.0; +https://example.com/bot)";

// r.jina.ai permet de bypass des restrictions côté serveur distant
function proxyWrap(url) {
  const u = url.replace(/^https?:\/\//, "");
  return `https://r.jina.ai/http://${u}`;
}

function abortAfter(ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return { ctrl, t };
}

async function safeFetch(url, { timeout = 6000 } = {}) {
  // 1) tentative directe
  try {
    const { ctrl, t } = abortAfter(timeout);
    const r = await fetch(url, {
      cache: "no-store",
      headers: { "User-Agent": UA },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (r.ok) return r;
  } catch {
    // noop
  }

  // 2) fallback via proxy
  try {
    const { ctrl, t } = abortAfter(timeout);
    const r2 = await fetch(proxyWrap(url), {
      cache: "no-store",
      headers: { "User-Agent": UA },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (r2.ok) return r2;
  } catch {
    // noop
  }

  throw new Error("fetch_failed");
}

// Décode CDATA et trim
function cleanText(s = "") {
  return s.replace(/<!\[CDATA\[(.*?)\]\]>/gis, "$1").trim();
}

// ---------- Parsing RSS/Atom ----------
function parseRSS(xml, source) {
  const items = [];

  // RSS 2.0: <item>
  const reItem = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = reItem.exec(xml))) {
    const block = m[1];
    const pick = (tag) =>
      cleanText(
        block.match(
          new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")
        )?.[1] ?? ""
      );

    const title = pick("title");
    const link =
      pick("link") ||
      cleanText(
        block.match(/<guid\b[^>]*>([\s\S]*?)<\/guid>/i)?.[1] ?? ""
      );
    const pub = pick("pubDate") || pick("dc:date") || "";

    if (title || link) {
      items.push({
        id:
          (link || title || Math.random().toString(36).slice(2)).slice(
            0,
            128
          ),
        title,
        url: link || "",
        source,
        updatedAtISO: pub
          ? new Date(pub).toISOString()
          : new Date().toISOString(),
      });
    }
  }

  // Atom: <entry>
  const reEntry = /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi;
  while ((m = reEntry.exec(xml))) {
    const block = m[1];
    const pick = (tag) =>
      cleanText(
        block.match(
          new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")
        )?.[1] ?? ""
      );

    const title = pick("title");
    const linkHref =
      block.match(
        /<link\b[^>]*href=["']([^"']+)["'][^>]*\/?>/i
      )?.[1] ?? "";
    const updated = pick("updated") || pick("published") || "";

    if (title || linkHref) {
      items.push({
        id:
          (linkHref || title || Math.random().toString(36).slice(2)).slice(
            0,
            128
          ),
        title,
        url: linkHref || "",
        source,
        updatedAtISO: updated
          ? new Date(updated).toISOString()
          : new Date().toISOString(),
      });
    }
  }

  return items;
}

// Déduplication par URL puis par titre
function dedupe(items) {
  const seenUrl = new Set();
  const seenTitle = new Set();
  const out = [];

  for (const it of items) {
    const keyU = (it.url || "").toLowerCase();
    const keyT = (it.title || "").toLowerCase();

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

// ---------- Handler ----------
export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: headers() });
  }

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

    const results = [];

    for (const url of urls) {
      if (!url) continue;

      try {
        const r = await safeFetch(url, { timeout: 6500 });
        const xml = await r.text();
        const items = parseRSS(xml, url).slice(0, 40);
        results.push(...items);
      } catch (e) {
        results.push({
          id: `err-${Math.random().toString(36).slice(2)}`,
          title: `Erreur RSS: ${url}`,
          url,
          source: url,
          updatedAtISO: new Date().toISOString(),
          error: String(e?.message || e) || "fetch_failed",
        });
      }
    }

    const sorted = results.sort(
      (a, b) => new Date(b.updatedAtISO) - new Date(a.updatedAtISO)
    );
    const unique = dedupe(sorted).slice(0, 100);

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
