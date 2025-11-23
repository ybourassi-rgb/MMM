"use client";

export default function DealCard({ item, active }) {
  const {
    title, subtitle, type, city, score,
    price, est, margin, risk, horizon,
    tags, mediaLabel, url
  } = item;

  return (
    <div className={`card ${active ? "active" : ""}`}>
      {/* MEDIA */}
      <div className="media">
        <div className="badge">
          <span className="score">Y-Score {score}</span>
          <span className="chip">{type}</span>
          {city && <span className="chip">{city}</span>}
        </div>
        <span className="mediaLabel">{mediaLabel || "MEDIA"}</span>
      </div>

      {/* ACTIONS FLOAT RIGHT */}
      <div className="actions">
        <button className="abtn">💾<small>Favori</small></button>
        <button className="abtn">📤<small>Partager</small></button>
        <button className="abtn">🧠<small>Analyse</small></button>
      </div>

      {/* CONTENT */}
      <div className="content">
        <h2>{title}</h2>
        <p className="sub">{subtitle}</p>

        <div className="kpis">
          <div className="kpi">
            <span>Marge</span>
            <b className="good">{margin}</b>
          </div>
          <div className="kpi">
            <span>Risque</span>
            <b className="warn">{risk}</b>
          </div>
          <div className="kpi">
            <span>Horizon</span>
            <b>{horizon}</b>
          </div>
        </div>

        <div className="tags">
          {tags?.map(t => <span key={t} className="tag">{t}</span>)}
        </div>

        <div className="cta">
          <a href={url || "#"} className="primary">Voir</a>
          <button className="secondary">Pourquoi ?</button>
        </div>
      </div>

      <style jsx>{`
        .card{
          height:100%;border-radius:18px;overflow:hidden;position:relative;
          background:#0f1422;border:1px solid #1b2440;display:flex;flex-direction:column;
        }
        .media{
          flex:1;display:grid;place-items:center;color:#95a0b8;font-weight:700;
          background:
            radial-gradient(1200px 400px at 20% -20%,#1c2d5a,transparent 60%),
            radial-gradient(1200px 500px at 120% 20%,#0c5f5a,transparent 55%),
            linear-gradient(180deg,#0b1020,#0a0f1d);
        }
        .badge{
          position:absolute;left:12px;top:12px;display:flex;gap:6px;align-items:center;
          background:rgba(8,12,22,.7);border:1px solid #233155;padding:6px 8px;border-radius:12px;font-size:12px
        }
        .score{
          font-weight:800;color:white;background:rgba(78,163,255,.15);
          border:1px solid rgba(78,163,255,.5);padding:2px 7px;border-radius:999px;
        }
        .chip{
          font-size:11px;color:#cbd3e7;background:#111938;border:1px solid #1f2a55;
          padding:4px 6px;border-radius:999px;
        }
        .mediaLabel{opacity:.8}
        .actions{
          position:absolute;right:8px;bottom:130px;display:grid;gap:10px;z-index:2;
        }
        .abtn{
          width:56px;height:56px;border-radius:14px;background:#0b1124;border:1px solid #1b2440;
          display:grid;place-items:center;color:#e9ecf5;font-size:20px;
        }
        .abtn small{font-size:10px;color:#b9c2d8;margin-top:2px}
        .content{padding:12px;display:grid;gap:8px;}
        h2{margin:0;font-size:18px}
        .sub{margin:0;color:#8b93a7;font-size:13px}
        .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
        .kpi{background:#0c1226;border:1px solid #1a2340;border-radius:12px;padding:8px;font-size:12px}
        .kpi b{display:block;font-size:15px;margin-top:2px}
        .good{color:#18d47b}
        .warn{color:#ffb454}
        .tags{display:flex;gap:6px;flex-wrap:wrap}
        .tag{font-size:11px;color:#cbd3e7;background:#111938;border:1px solid #1f2a55;padding:4px 6px;border-radius:999px;}
        .cta{display:flex;gap:8px;margin-top:4px}
        .primary, .secondary{
          flex:1;padding:12px;border-radius:12px;font-weight:800;text-align:center;border:1px solid #27406f;
        }
        .primary{background:#112449;color:#e7f0ff;text-decoration:none;}
        .secondary{background:#0c1226;border-color:#1b2440;color:#d7dbea;}
      `}</style>
    </div>
  );
}
