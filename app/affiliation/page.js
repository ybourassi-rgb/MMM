"use client";

import { useEffect, useMemo, useState } from "react";

export default function AffiliationPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/earnings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  const format = (n) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
    }).format(n || 0);

  const totalClicks = data?.totalClicks || 0;
  const estimated = data?.estimated || 0;

  const byNetwork = data?.byNetwork || [];
  const topDeals = data?.topDeals || [];

  const titleNetwork = (k) => {
    if (k === "amazon") return "Amazon";
    if (k === "aliexpress") return "AliExpress";
    return "Autres partenaires";
  };

  const badge = useMemo(() => {
    if (estimated >= 100) return "🔥 Machine à cash";
    if (estimated >= 25) return "✅ En progression";
    if (estimated >= 5) return "⭐ Premiers gains";
    return "Nouveau";
  }, [estimated]);

  return (
    <div className="wrap">
      <header className="top">
        <h1>Affiliation</h1>
        <div className="badge">{badge}</div>
      </header>

      {loading && <div className="loading">Chargement…</div>}

      {!loading && (
        <>
          {/* ===== KPI ===== */}
          <section className="kpis">
            <div className="kpi">
              <div className="kpiTitle">Clics totaux</div>
              <div className="kpiValue">{totalClicks}</div>
            </div>
            <div className="kpi">
              <div className="kpiTitle">Gains estimés</div>
              <div className="kpiValue good">{format(estimated)}</div>
              <div className="kpiHint">Estimation basée sur EPC moyen</div>
            </div>
          </section>

          {/* ===== Par réseau ===== */}
          <section className="section">
            <h2>Par partenaire</h2>

            {!byNetwork.length ? (
              <div className="muted">Aucun clic enregistré pour l’instant.</div>
            ) : (
              <div className="rows">
                {byNetwork.map((n) => (
                  <div key={n.network} className="row">
                    <div className="left">
                      <div className="rowTitle">{titleNetwork(n.network)}</div>
                      <div className="rowSub">
                        {n.count} clics • EPC {format(n.epc)}
                      </div>
                    </div>
                    <div className="right">{format(n.estimated)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ===== Top deals ===== */}
          <section className="section">
            <h2>Top deals générateurs</h2>

            {!topDeals.length ? (
              <div className="muted">Pas assez de données.</div>
            ) : (
              <div className="dealList">
                {topDeals.map((d, i) => (
                  <button
                    key={d.title + i}
                    className="dealRow"
                    onClick={() => d.url && window.open(d.url, "_blank")}
                  >
                    <div className="rank">#{i + 1}</div>

                    <div className="dealMeta">
                      <div className="dealTitle">{d.title}</div>
                      <div className="dealSub">
                        {d.domain || "domaine inconnu"} • {d.count} clics
                      </div>
                    </div>

                    <div className="dealMoney">{format(d.estimated)}</div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ===== Tips ===== */}
          <section className="section tips">
            <h2>Conseils pour booster</h2>
            <ul>
              <li>Publie surtout des deals **Amazon / AliExpress / Travel**.</li>
              <li>Les titres clairs + prix visible → + clics.</li>
              <li>Ajoute une vraie image (tu l’as verrouillé ✅).</li>
              <li>Plus tu as de deals, plus l’app remonte dans Google.</li>
            </ul>
          </section>
        </>
      )}

      <style jsx>{`
        .wrap {
          min-height: 100svh;
          background: #07090f;
          color: white;
          padding: 14px 14px 90px;
        }

        .top {
          position: sticky;
          top: 0;
          z-index: 5;
          background: #07090f;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 10px;
        }
        h1 {
          margin: 0;
          font-size: 20px;
          font-weight: 900;
        }
        .badge {
          font-size: 11px;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(78,163,255,0.12);
          border: 1px solid rgba(78,163,255,0.35);
        }

        .loading {
          text-align: center;
          padding: 20px 0;
          color: #aeb6cc;
        }

        .kpis {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
        }
        .kpi {
          background: #0f1422;
          border: 1px solid #1b2440;
          border-radius: 14px;
          padding: 12px;
          display: grid;
          gap: 6px;
        }
        .kpiTitle {
          font-size: 12px;
          color: #aeb6cc;
          font-weight: 700;
        }
        .kpiValue {
          font-size: 20px;
          font-weight: 900;
        }
        .kpiValue.good { color: #00e389; }
        .kpiHint {
          font-size: 10px;
          color: #8b93a7;
        }

        .section {
          margin-top: 12px;
          background: #0f1422;
          border: 1px solid #1b2440;
          border-radius: 14px;
          padding: 12px;
        }
        .section h2 {
          margin: 0 0 10px;
          font-size: 15px;
          font-weight: 900;
        }

        .muted { color: #aeb6cc; font-size: 13px; }

        .rows { display: grid; gap: 8px; }
        .row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 8px 10px;
        }
        .rowTitle { font-weight: 900; font-size: 13px; }
        .rowSub { font-size: 11px; color: #c6cce0; }
        .right { font-weight: 900; }

        .dealList { display: grid; gap: 8px; }
        .dealRow {
          display: grid;
          grid-template-columns: 40px 1fr auto;
          gap: 10px;
          align-items: center;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 8px;
          color: white;
          text-align: left;
        }
        .rank {
          font-weight: 900;
          color: #4ea3ff;
          font-size: 12px;
        }
        .dealMeta { display: grid; gap: 4px; }
        .dealTitle {
          font-size: 13px;
          font-weight: 800;
          line-height: 1.25;
          max-height: 2.6em;
          overflow: hidden;
        }
        .dealSub {
          font-size: 11px;
          color: #c6cce0;
        }
        .dealMoney {
          font-weight: 900;
          color: #00e389;
          font-size: 13px;
        }

        .tips ul {
          margin: 0;
          padding-left: 16px;
          display: grid;
          gap: 6px;
          font-size: 13px;
          color: #e9ecf5;
        }
      `}</style>
    </div>
  );
}
