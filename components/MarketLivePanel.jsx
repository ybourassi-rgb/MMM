// components/MarketLivePanel.jsx
import { useEffect, useState } from "react";

export default function MarketLivePanel() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [serverTime, setServerTime] = useState("");
  const [todayFr, setTodayFr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const r = await fetch("/api/status", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || "Flux indisponible");
      setFeed(data.feed || []);
      setServerTime(data.serverNowISO || "");
      setTodayFr(data.todayFr || "");
    } catch (e) {
      setErr(e?.message || "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <section style={{ marginTop: 16 }}>
      <header style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h3 style={{ margin:0 }}>Marché en direct</h3>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {todayFr && <small>Aujourd’hui : <strong>{todayFr}</strong></small>}
          {serverTime && <small>• Maj : <strong>{new Date(serverTime).toLocaleTimeString("fr-FR",{ hour:"2-digit", minute:"2-digit"})}</strong></small>}
          <button onClick={load} disabled={loading}>{loading ? "Rafraîchit…" : "Rafraîchir"}</button>
        </div>
      </header>

      {err && (
        <div style={{ marginTop:8, color:"#f66" }}>
          ❌ {err}
        </div>
      )}

      <div style={{ marginTop:12, display:"grid", gap:8 }}>
        {loading && <div>Chargement…</div>}

        {!loading && feed.length === 0 && !err && (
          <div style={{ opacity:0.8 }}>
            Aucune opportunité disponible pour le moment. Réessaie dans quelques minutes.
          </div>
        )}

        {feed.map(item => (
          <a key={item.id} href={item.url} target="_blank" rel="noreferrer"
             style={{ padding:12, border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, textDecoration:"none", color:"inherit" }}>
            <div style={{ fontWeight:600 }}>{item.title}</div>
            <div style={{ opacity:0.8 }}>
              {item.type?.toUpperCase()} • {item.price ? `${item.price.toLocaleString("fr-FR")} MAD` : "—"}
            </div>
            <small style={{ opacity:0.7 }}>
              Maj source : {item.updatedAtISO ? new Date(item.updatedAtISO).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}) : "—"}
            </small>
          </a>
        ))}
      </div>
    </section>
  );
}
