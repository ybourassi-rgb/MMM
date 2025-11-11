// components/MarketLivePanel.jsx
import { useEffect, useMemo, useState } from "react";

// (optionnel) passe un tableau d'URLs RSS si tu veux le fallback:
// <MarketLivePanel sources={["https://.../flux1.rss","https://.../flux2.rss"]} />
export default function MarketLivePanel({ sources = [] }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [serverTimeISO, setServerTimeISO] = useState("");
  const [todayFr, setTodayFr] = useState("");

  const serverTime = useMemo(() => {
    if (!serverTimeISO) return "";
    try {
      const d = new Date(serverTimeISO);
      return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  }, [serverTimeISO]);

  async function loadFromStatus() {
    const r = await fetch("/api/status", { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    if (!data?.ok) throw new Error(data?.error || "status non OK");
    setTodayFr(data.todayFr || "");
    setServerTimeISO(data.serverNowISO || "");
    setItems(Array.isArray(data.feed) ? data.feed : []);
  }

  async function loadFromRss() {
    if (!sources.length) return;
    const r = await fetch("/api/rss_fetch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: sources }),
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`RSS HTTP ${r.status}`);
    const data = await r.json();
    if (!data?.ok) throw new Error(data?.error || "rss_fetch non OK");
    setServerTimeISO(data.serverNowISO || "");
    // Normalise vers le même schéma attendu par l'UI
    const mapped = (data.items || []).map(x => ({
      id: x.id,
      type: guessType(x),                      // auto/immo/crypto… (heuristique simple)
      title: x.title,
      price: null,                             // si tu extrais le prix du titre, set ici
      url: x.url,
      updatedAtISO: x.updatedAtISO,
      source: x.source,
    }));
    setItems(mapped);
  }

  function guessType(x) {
    const u = (x.url || x.source || "").toLowerCase();
    if (u.includes("auto") || u.includes("voiture") || u.includes("cars")) return "auto";
    if (u.includes("immo") || u.includes("realestate") || u.includes("immobilier") || u.includes("booking") || u.includes("airbnb")) return "immo";
    if (u.includes("crypto") || u.includes("coin")) return "crypto";
    return "gen";
  }

  async function load() {
    setLoading(true);
    setErr("");
    setItems([]);
    try {
      // 1) /api/status (ton endpoint maison)
      await loadFromStatus();

      // 2) Fallback facultatif sur /api/rss_fetch si pas d’items
      if (items.length === 0 && sources.length) {
        await loadFromRss();
      }
    } catch (e) {
      // Fallback direct vers RSS si /status échoue
      if (sources.length) {
        try {
          await loadFromRss();
        } catch (e2) {
          setErr(e2?.message || String(e2));
        }
      } else {
        setErr(e?.message || String(e));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  function affiliateHref(rawUrl, type = "gen") {
    // Lien PROXY d’affiliation (préserve tracking) :
    // /api/r?u=<URL affiliée encodée>&s=<type>
    if (!rawUrl) return "#";
    return `/api/r?u=${encodeURIComponent(rawUrl)}&s=${encodeURIComponent(type || "gen")}`;
  }

  return (
    <section style={{ marginTop: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <h3 style={{ margin: 0 }}>Marché en direct</h3>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {todayFr && <small> Aujourd’hui : <strong>{todayFr}</strong></small>}
          {serverTime && <small> • Maj : <strong>{serverTime}</strong></small>}
          <button onClick={load} disabled={loading}>{loading ? "Rafraîchit…" : "Rafraîchir"}</button>
        </div>
      </header>

      {err && (
        <div style={{ marginTop: 8, color: "#f66" }}>
          ❌ {err}
        </div>
      )}

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {loading && <div>Chargement…</div>}

        {!loading && items.length === 0 && !err && (
          <div style={{ opacity: 0.8 }}>
            Aucune opportunité pour le moment. Réessaie plus tard.
          </div>
        )}

        {items.map(item => (
          <article key={item.id}
            style={{
              padding: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              display: "grid",
              gap: 6,
            }}>
            <div style={{ fontWeight: 600 }}>{item.title}</div>
            <div style={{ opacity: 0.85 }}>
              {(item.type || "GEN").toUpperCase()}
              {typeof item.price === "number" ? ` • ${item.price.toLocaleString("fr-FR")} MAD` : ""}
            </div>
            <small style={{ opacity: 0.7 }}>
              {item.updatedAtISO
                ? `Maj source : ${new Date(item.updatedAtISO).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                : "Maj source : —"}
              {item.source ? ` • Source: ${new URL(item.source).hostname}` : ""}
            </small>

            {/* ⚡️ Lien d’affiliation via /api/r (préserve tracking) */}
            <div style={{ marginTop: 6 }}>
              <a
                href={affiliateHref(item.url, item.type)}
                target="_blank"
                rel="nofollow sponsored noopener"
                style={{
                  display: "inline-block",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.2)",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                Voir l’offre
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
