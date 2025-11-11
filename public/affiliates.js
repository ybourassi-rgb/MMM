<script>
  function buildAffiliateUrl({ rawUrl, dealId, userId, network, siteId, subKey = "subid" }) {
    const u = new URL(rawUrl);
    u.searchParams.set("utm_source", "mmm");
    u.searchParams.set("utm_medium", "affiliate");
    u.searchParams.set("utm_campaign", "yscore");
    const subid = [dealId || "D0", userId || "U0"].join("_").slice(0, 64);

    if (network === "awin") {
      const out = new URL("https://www.awin1.com/cread.php");
      out.searchParams.set("awinmid", siteId || "");
      if (window.AFF_AWIN_AFFID) out.searchParams.set("awinaffid", window.AFF_AWIN_AFFID);
      out.searchParams.set("ued", encodeURIComponent(u.toString()));
      out.searchParams.set("clickref", subid);
      return out.toString();
    }
    if (network === "impact") {
      const out = new URL(window.AFF_IMPACT_BASE || "https://t.example.io/c");
      out.searchParams.set("m", siteId || "");
      out.searchParams.set("sid", subid);
      out.searchParams.set("url", u.toString());
      return out.toString();
    }
    u.searchParams.set(subKey, subid);
    return u.toString();
  }
  window.MM_AFF = { buildAffiliateUrl };
</script>
