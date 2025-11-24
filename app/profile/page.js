"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

export default function ProfilePage() {
  const [pseudo, setPseudo] = useState("Vendeur");
  const [deals, setDeals] = useState([]);
  const [stats, setStats] = useState({ total: 0, byDomain: [] });
  const [loading, setLoading] = useState(true);

  // charge pseudo local
  useEffect(() => {
    const p = localStorage.getItem("lbs_pseudo");
    if (p) setPseudo(p);
  }, []);

  // charge deals + stats
  useEffect(() => {
    Promise.all([
      fetch("/api/publish", { cache: "no-store" }).then(r => r.json()),
      fetch("/api/stats", { cache: "no-store" }).then(r => r.json()),
    ])
      .then(([pub, st]) => {
        setDeals(pub.items || []);
        setStats({ total: st.total || 0, byDomain: st.byDomain || [] });
      })
      .finally(() => setLoading(false));
  }, []);

  const totalDeals = deals.length;
  const totalClicks = stats.total;

  // badge confiance simple
  const badge = useMemo(() => {
    if (totalDeals >= 30 || totalClicks >= 300) return { label: "🔥 Vendeur Star", color: "gold" };
    if (totalDeals >= 10 || totalClicks >= 80) return { label: "✅ Confiance", color: "green" };
    if (totalDeals >= 3) return { label: "⭐ Actif", color: "blue" };
    return { label: "Nouveau", color: "gray" };
  }, [totalDeals, totalClicks]);

  const onSavePseudo = () => {
    const p = prompt("Ton pseudo vendeur :", pseudo);
    if (!p) return;
    setPseudo(p);
    localStorage.setItem("lbs_pseudo", p);
  };

  const openDeal = (it) => {
    const finalUrl = it.affiliateUrl || it.url || it.link;
    if (!finalUrl) return;
    window.open(finalUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="wrap">
      <header className="top">
        <h1>Profil</h1>
        <button onClick={onSavePseudo} className="edit">✏️ Modifier</button>
      </header>

      {/* ===== CARD PROFIL ===== */}
      <div className="profileCard">
        <div className="avatar">{pseudo[0]?.toUpperCase() || "L"}</div>
        <div className="info">
          <div className="name">{pseudo}</div>
          <div className={`badge ${badge.color}`}>{badge.label}</div>
          <div className="line">
            <span>📦 {totalDeals} deals</span>
            <span>👀 {totalClicks} clics</span>
          </div>
        </div>
      </div>

      {loading && <div className="loading">Chargement…</div>}

      {!loading && (
        <>
          {/* ===== TOP DOMAINES ===== */}
          <section className="section">
            <h2>Stats clics</h2>

            {!stats.byDomain.length ? (
              <div className="muted">Pas encore de clic enregistré.</div>
            ) : (
              <div className="domains">
                {stats.byDomain.map((d) => (
                  <div key={d.domain} className="domainRow">
                    <span className="domain">{d.domain}</span>
                    <span className="count">{d.count}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ===== MES DEALS ===== */}
          <section className="section">
            <h2>Mes deals publiés</h2>

            {!deals.length ? (
              <div className="muted">Tu n’as pas encore publié de deal.</div>
            ) : (
              <div className="dealList">
                {deals.map((it, i) => (
                  <button
                    key={it.id || i}
                    className="dealRow"
                    onClick={() => openDeal(it)}
                  >
                    <div className="thumb">
                      {it.image ? (
                        <Image
                          src={it.image}
                          alt={it.title}
                          fill
                          sizes="60px"
                          style={{ objectFit: "contain" }}
                          unoptimized
                        />
                      ) : (
                        <div className="thumbFallback">🖼️</div>
                      )}
                    </div>

                    <div className="dealMeta">
                      <div className="dealTitle">{it.title}</div>
                      <div className="dealSub">
                        {it.price && <span>{it.price}</span>}
                        {it.city && <span>📍 {it.city}</span>}
                        {it.category && <span className="cat">{it.category}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
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
        .edit {
          background: #0e1322;
          border: 1px solid #1a2340;
          color: white;
          border-radius: 10px;
          padding: 7px 10px;
          font-size: 12px;
        }

        .profileCard {
          display: flex;
          gap: 12px;
          align-items: center;
          background: #0f1422;
          border: 1px solid #1b2440;
          border-radius: 14px;
          padding: 12px;
          margin-bottom: 14px;
        }
        .avatar {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-weight: 900;
          font-size: 22px;
          background: radial-gradient(circle at 30% 30%, #6d7bff, transparent 60%),
                      radial-gradient(circle at 70% 70%, #22e6a5, transparent 55%),
                      #0b1020;
        }
        .info { display: grid; gap: 6px; }
        .name {
          font-size: 16px;
          font-weight: 900;
        }
        .badge {
          font-size: 11px;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 999px;
          width: fit-content;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .badge.gold { background: rgba(255, 204, 0, 0.12); color: #ffdd55; }
        .badge.green { background: rgba(0, 227, 137, 0.12); color: #00e389; }
        .badge.blue { background: rgba(78, 163, 255, 0.12); color: #4ea3ff; }
        .badge.gray { background: rgba(255,255,255,0.06); color: #aeb6cc; }

        .line {
          display: flex;
          gap: 10px;
          font-size: 12px;
          color: #c6cce0;
        }

        .loading {
          text-align: center;
          padding: 20px 0;
          color: #aeb6cc;
        }

        .section {
          margin-top: 14px;
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

        .domains {
          display: grid;
          gap: 6px;
        }
        .domainRow {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          background: rgba(255,255,255,0.04);
          padding: 8px 10px;
          border-radius: 10px;
        }
        .domain { color: #e9ecf5; }
        .count { font-weight: 900; }

        .dealList { display: grid; gap: 8px; }
        .dealRow {
          display: grid;
          grid-template-columns: 60px 1fr;
          gap: 10px;
          align-items: center;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 8px;
          color: white;
          text-align: left;
        }
        .thumb {
          position: relative;
          width: 60px;
          height: 60px;
          background: #0b1020;
          border-radius: 8px;
          overflow: hidden;
        }
        .thumbFallback {
          height: 100%;
          display: grid;
          place-items: center;
          color: #aeb6cc;
          font-size: 18px;
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
          font-size: 12px;
          color: #c6cce0;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .cat {
          background: rgba(255,255,255,0.06);
          padding: 2px 6px;
          border-radius: 999px;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
