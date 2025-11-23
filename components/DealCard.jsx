"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

export default function DealCard({ item, active }) {
  const {
    title = "Opportunité",
    subtitle,
    type,
    city,
    score,
    price,
    est,
    margin,
    risk,
    horizon,
    tags,
    mediaLabel,
    url,
    link,          // <= parfois Dealabs renvoie link
    affiliateUrl,
    image,
    category,
    halal,
  } = item || {};

  // ✅ 1) Lien final sûr
  const finalUrl = useMemo(
    () => affiliateUrl || url || link || null,
    [affiliateUrl, url, link]
  );

  // ✅ 2) Fallback image si cassée
  const [imgOk, setImgOk] = useState(true);
  const finalImage = imgOk ? image : null;

  const openLink = (l) => {
    if (!l) return;
    window.open(l, "_blank", "noopener,noreferrer");
  };

  const trackClick = async (domain) => {
    try {
      await fetch("/api/log-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          title,
          score,
          category: category || type,
          url: finalUrl,
        }),
      });
    } catch (e) {
      console.error("track error", e);
    }
  };

  const onSee = async () => {
    if (!finalUrl) return;
    try {
      const domain = new URL(finalUrl).hostname;
      await trackClick(domain);
    } catch {}
    openLink(finalUrl);
  };

  const onShare = async () => {
    const l = finalUrl || "";
    try {
      if (navigator.share) {
        await navigator.share({ title, text: title, url: l });
      } else {
        await navigator.clipboard.writeText(l);
        alert("Lien copié ✅");
      }
    } catch (e) {
      console.error("share error", e);
    }
  };

  const onFav = () => console.log("Fav:", item);
  const onAnalyze = () => console.log("Analyze:", item);

  return (
    <div className={`card ${active ? "active" : ""}`}>
      {/* MEDIA */}
      <div className="media">
        {finalImage ? (
          <Image
            src={finalImage}
            alt={title}
            fill
            priority={active}
            sizes="100vw"
            quality={90}
            onError={() => setImgOk(false)}
            style={{ objectFit: "cover" }}
          />
        ) : (
          <span className="mediaLabel">
            {image ? "Image indisponible" : (mediaLabel || "MEDIA")}
          </span>
        )}

        <div className="gradient" />

        <div className="badge">
          {score != null && <span className="score">Y-Score {score}</span>}
          <span className="chip">{type || category || "deal"}</span>
          {city && <span className="chip">{city}</span>}
          {halal != null && (
            <span className="chip">{halal ? "Halal ✅" : "Non Halal ⚠️"}</span>
          )}
        </div>
      </div>

      {/* ACTIONS FLOAT RIGHT */}
      <div className="actions">
        <button className="abtn" onClick={onFav}>
          ❤️<small>Favori</small>
        </button>
        <button className="abtn" onClick={onShare}>
          📤<small>Partager</small>
        </button>
        <button className="abtn" onClick={onAnalyze}>
          🧠<small>Analyse</small>
        </button>
        <button className="abtn" onClick={onSee} disabled={!finalUrl}>
          🔗<small>Voir</small>
        </button>
      </div>

      {/* CONTENT */}
      <div className="content">
        <h2>{title}</h2>
        {subtitle && <p className="sub">{subtitle}</p>}

        <div className="kpis">
          {margin && (
            <div className="kpi">
              <span>Marge</span>
              <b className="good">{margin}</b>
            </div>
          )}
          {risk && (
            <div className="kpi">
              <span>Risque</span>
              <b className="warn">{risk}</b>
            </div>
          )}
          {horizon && (
            <div className="kpi">
              <span>Horizon</span>
              <b>{horizon}</b>
            </div>
          )}
        </div>

        {!!tags?.length && (
          <div className="tags">
            {tags.map((t) => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        )}

        <div className="cta">
          <button onClick={onSee} className="primary" disabled={!finalUrl}>
            Voir
          </button>
          <button onClick={onAnalyze} className="secondary">
            Pourquoi ?
          </button>
        </div>
      </div>

      <style jsx>{`
        .card{
          height:100%;
          border-radius:18px;
          overflow:hidden;
          position:relative;
          background:#0f1422;
          border:1px solid #1b2440;
          display:flex;
          flex-direction:column;
        }

        .media{
          flex:1;
          position:relative;
          display:grid;
          place-items:center;
          color:#95a0b8;
          font-weight:700;
          background:#0b1020;
        }

        .gradient{
          position:absolute; inset:0;
          background:
            radial-gradient(1200px 400px at 20% -20%,rgba(28,45,90,.55),transparent 60%),
            radial-gradient(1200px 500px at 120% 20%,rgba(12,95,90,.45),transparent 55%),
            linear-gradient(180deg,rgba(0,0,0,.1),rgba(0,0,0,.75));
          z-index:1;
        }

        .badge{
          position:absolute;
          left:12px; top:12px;
          display:flex; gap:6px; align-items:center;
          background:rgba(8,12,22,.7);
          border:1px solid #233155;
          padding:6px 8px;
          border-radius:12px;
          font-size:12px;
          z-index:2;
        }
        .score{
          font-weight:800;color:white;background:rgba(78,163,255,.15);
          border:1px solid rgba(78,163,255,.5);
          padding:2px 7px;border-radius:999px;
        }
        .chip{
          font-size:11px;color:#cbd3e7;background:#111938;border:1px solid #1f2a55;
          padding:4px 6px;border-radius:999px;
        }

        .mediaLabel{opacity:.8; z-index:2}

        /* ✅ ICI: on remonte les icônes */
        .actions{
          position:absolute;
          right:8px;
          top:180px;           /* 👈 remonte */
          display:grid;
          gap:10px;
          z-index:3;
        }

        .abtn{
          width:56px;height:56px;border-radius:14px;
          background:#0b1124;border:1px solid #1b2440;
          display:grid;place-items:center;
          color:#e9ecf5;font-size:20px;
          backdrop-filter: blur(6px);
        }
        .abtn small{font-size:10px;color:#b9c2d8;margin-top:2px}
        .abtn:disabled{opacity:.5; cursor:not-allowed}

        .content{padding:12px;display:grid;gap:8px;}
        h2{margin:0;font-size:18px}
        .sub{margin:0;color:#8b93a7;font-size:13px}
        .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
        .kpi{
          background:#0c1226;border:1px solid #1a2340;border-radius:12px;
          padding:8px;font-size:12px
        }
        .kpi b{display:block;font-size:15px;margin-top:2px}
        .good{color:#18d47b}
        .warn{color:#ffb454}

        .tags{display:flex;gap:6px;flex-wrap:wrap}
        .tag{
          font-size:11px;color:#cbd3e7;background:#111938;border:1px solid #1f2a55;
          padding:4px 6px;border-radius:999px;
        }

        .cta{display:flex;gap:8px;margin-top:4px}
        .primary, .secondary{
          flex:1;padding:12px;border-radius:12px;font-weight:800;
          text-align:center;border:1px solid #27406f;
        }
        .primary{background:#112449;color:#e7f0ff;}
        .secondary{background:#0c1226;border-color:#1b2440;color:#d7dbea;}
      `}</style>
    </div>
  );
}
