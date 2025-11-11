// lib/affiliator_core.js
// Génère un lien affilié robuste (direct / AWIN / Impact).
// N'utilise aucun secret côté client : secrets stockés en env côté serveur.

import { URL } from "url";

const UTM = { source: "mmm", medium: "affiliate", campaign: "yscore" };

export function buildAffiliateUrl({
  rawUrl,
  dealId = "D0",
  userId = "U0",
  network = process.env.AFF_NET || "direct",
  siteId = process.env.AFF_SITE_ID || "",
  subKey = process.env.AFF_SUBKEY || "subid",
}) {
  if (!rawUrl) throw new Error("buildAffiliateUrl: rawUrl is required");
  const base = new URL(rawUrl);

  // UTM systématiques
  base.searchParams.set("utm_source", UTM.source);
  base.searchParams.set("utm_medium", UTM.medium);
  base.searchParams.set("utm_campaign", UTM.campaign);

  // SubID compact
  const subid = [dealId, userId].filter(Boolean).join("_").slice(0, 64);

  // Mapping réseaux
  if (network === "awin") {
    // https://www.awin1.com/cread.php?awinmid=<MID>&awinaffid=<AFFID>&ued=<ENCODED_URL>&clickref=<SUBID>
    const out = new URL("https://www.awin1.com/cread.php");
    out.searchParams.set("awinmid", siteId);
    if (process.env.AFF_AWIN_AFFID) out.searchParams.set("awinaffid", process.env.AFF_AWIN_AFFID);
    out.searchParams.set("ued", encodeURIComponent(base.toString()));
    out.searchParams.set("clickref", subid);
    return out.toString();
  }

  if (network === "impact") {
    // Adapter la base si nécessaire
    const impactBase = process.env.AFF_IMPACT_BASE || "https://t.example.io/c";
    const out = new URL(impactBase);
    out.searchParams.set("m", siteId);
    out.searchParams.set("sid", subid);
    out.searchParams.set("url", base.toString());
    return out.toString();
  }

  // Par défaut: subid direct
  base.searchParams.set(subKey, subid);
  return base.toString();
}

// Confort : ajoute affiliateUrl à un item { title, link, id, ... }
export function enrichItemWithAffiliate(item, opts = {}) {
  const dealId = item.id || item.dealId || item.guid || "D0";
  const userId = opts.userId || "MMM";
  const affiliateUrl = buildAffiliateUrl({
    rawUrl: item.link || item.url,
    dealId,
    userId,
    network: opts.network,
    siteId: opts.siteId,
    subKey: opts.subKey,
  });
  return { ...item, affiliateUrl, dealId, userId };
}
