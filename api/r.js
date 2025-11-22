// /api/r.js  (Node.js runtime, Vercel friendly)
export default async function handler(req, res) {
  // no-store headers
  const noStore = {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
    "CDN-Cache-Control": "no-store",
    "Vercel-CDN-Cache-Control": "no-store"
  };

  // ✅ Domains autorisés (affiliation / redirection)
  const ALLOW = [
    // e-commerce / auto
    "ebay.fr", "www.ebay.fr",
    "amazon.fr", "www.amazon.fr", "amzn.to",

    // travel
    "booking.com", "www.booking.com",
    "airbnb.fr", "www.airbnb.fr",

    // crypto news
    "coindesk.com", "www.coindesk.com",
    "cointelegraph.com", "www.cointelegraph.com",
    "fr.cointelegraph.com",

    // presse éco/finance FR
    "lesechos.fr", "www.lesechos.fr",
    "zonebourse.com", "www.zonebourse.com",
    "boursorama.com", "www.boursorama.com",

    // finance/business EN
    "reuters.com", "www.reuters.com",
    "cnbc.com", "www.cnbc.com",

    // tech
    "techcrunch.com", "www.techcrunch.com",
    "theverge.com", "www.theverge.com"
  ];

  function isAllowed(u) {
    try {
      const h = new URL(u).hostname.toLowerCase();
      return ALLOW.some(d => h === d || h.endsWith(`.${d}`));
    } catch {
      return false;
    }
  }

  async function incrClick(key) {
    const restUrl =
      process.env.UPSTASH_REST_URL ||
      process.env.UPSTASH_REDIS_REST_URL ||
      "";
    const restToken =
      process.env.UPSTASH_REST_TOKEN ||
      process.env.UPSTASH_REDIS_REST_TOKEN ||
      "";
    if (!restUrl || !restToken) return; // tracking facultatif

    fetch(`${restUrl}/incr/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${restToken}` }
    }).catch(() => {});
  }

  try {
    // ✅ Supporte u= (ancien) OU to= (nouveau)
    const u = (req.query.u || req.query.to || "").toString().trim();
    const s = (req.query.s || "gen").toString().trim(); // catégorie

    if (!u) {
      res.writeHead(400, noStore);
      return res.end("Missing u (or to)");
    }

    if (!isAllowed(u)) {
      res.writeHead(400, noStore);
      return res.end("Domain not allowed");
    }

    const target = new URL(u);

    // Ajoute automatiquement un identifiant de tracking
    if (!target.searchParams.has("subid")) {
      target.searchParams.set("subid", `mmm-${s}-${Date.now()}`);
    }

    // Comptage Upstash non bloquant
    incrClick(`click:${s}:${target.hostname}`);

    // Redirection
    res.writeHead(302, {
      ...noStore,
      Location: target.toString()
    });
    return res.end();
  } catch (e) {
    res.writeHead(500, noStore);
    return res.end("server error");
  }
}
