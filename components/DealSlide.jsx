"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

export default function DealSlide({ item, active }) {
  const {
    id,
    title = "Opportunité",
    image,
    price,
    score,
    city,
    category,
    margin,
    risk,
    horizon,
    url,
    link,
    affiliateUrl,
    summary,
    source,
  } = item || {};

  const finalUrl = useMemo(
    () => affiliateUrl || url || link || null,
    [affiliateUrl, url, link]
  );

  const [imgOk, setImgOk] = useState(true);

  // ✅ Image finale : vraie image si OK, sinon placeholder premium
  const finalImage = imgOk && image ? image : "/placeholders/IMG_2362.png";

  const [fav, setFav] = useState(false);

  const openLink = (l) => {
    if (!l) return;
    window.open(l, "_blank", "noopener,noreferrer");
  };

  const trackClick = async () => {
    try {
      if (!finalUrl) return;
      const domain = new URL(finalUrl).hostname;

      await fetch("/api/log-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          domain,
          title,
          score,
          category,
          url: finalUrl,
          image,
          source,
        }),
      });
    } catch {}
  };

  const onSee = () => {
    if (!finalUrl) return;
    openLink(finalUrl);
    trackClick();
  };

  const onFav = async () => {
    try {
      setFav((v) => !v);

      await fetch("/api/fav", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title,
          url: finalUrl || url,
          image,
          category,
          source,
        }),
      });
    } catch {}
  };

  // ✅ Analyse -> /yscore
  const onAnalyze = () => {
    if (!finalUrl) return;
    const q = encodeURIComponent(finalUrl);
    window.location.href = `/yscore?url=${q}`;
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
    } catch {}
  };

  return (
    <div className="deal-slide">
      {/* ===== MEDIA TOP ===== */}
      <div className="deal-media">
        <Image
          src={finalImage}
          alt={title}
          fill
          priority={active}
          sizes="100vw"
          onError={() => setImgOk(false)}
          style={{ objectFit: "contain" }}
          unoptimized
        />

        <div className="deal-gradient" />

        <div className="deal-top">
          {score != null && (
            <div className="deal-chip score">Y-Score {score}</div>
          )}
          {category && <div className="deal-chip">{category}</div>}
          {city && <div className="deal-chip">📍 {city}</div>}
        </div>
      </div>

      {/* ===== ACTIONS RIGHT ===== */}
      <div className="deal-actions">
        <button className="action-btn" onClick={onFav}>
          {fav ? "❤️" : "🤍"}<span>Favori</span>
        </button>

        <button className="action-btn" onClick={onShare}>
          📤<span>Partager</span>
        </button>

        <button className="action-btn" onClick={onAnalyze} disabled={!finalUrl}>
          🧠<span>Analyse</span>
        </button>

        <button className="action-btn" onClick={onSee} disabled={!finalUrl}>
          🔗<span>Voir</span>
        </button>
      </div>

      {/* ===== CONTENT BOTTOM ===== */}
      <div className="deal-content">
        <h2 className="deal-title">{title}</h2>

        {price && <p className="deal-price">Prix: {price}</p>}
        {summary && <p className="deal-summary">{summary}</p>}

        <div className="deal-metrics">
          {margin && (
            <div className="metric">
              <div className="metric-title">Marge</div>
              <div className="metric-value green">{margin}</div>
            </div>
          )}
          {risk && (
            <div className="metric">
              <div className="metric-title">Risque</div>
              <div className="metric-value orange">{risk}</div>
            </div>
          )}
          {horizon && (
            <div className="metric">
              <div className="metric-title">Horizon</div>
              <div className="metric-value">{horizon}</div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .deal-slide {
          height: 100%;
          width: 100%;
          position: relative;
          color: #fff;
          background: #0b1020;
          display: flex;
          flex-direction: column;
        }

        .deal-media {
          position: relative;
          width: 100%;
          height: 45vh;
          background: #0b1020;
          overflow: hidden;
        }

        .deal-gradient {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(900px 600px at 50% 0%, rgba(0,0,0,0.18), transparent 55%),
            linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.75));
          pointer-events: none;
        }

        .deal-top {
          position: absolute;
          top: 12px;
          left: 12px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          z-index: 2;
        }

        .deal-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0.38rem 0.75rem;
          border-radius: 999px;
          font-weight: 800;
          font-size: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(10,14,25,0.7);
          box-shadow: 0 6px 22px rgba(0,0,0,0.35);
          backdrop-filter: blur(6px);
          letter-spacing: .2px;
        }
        .deal-chip.score {
          background: linear-gradient(
            90deg,
            rgba(78,163,255,0.28),
            rgba(34,230,165,0.22)
          );
          border-color: rgba(78,163,255,0.55);
        }

        .deal-actions {
          position: absolute;
          right: 10px;
          top: calc(45vh - 110px);
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 3;
        }

        .action-btn {
          background: rgba(12,16,28,0.75);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #fff;
          border-radius: 16px;
          padding: 10px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-size: 18px;
          min-width: 58px;
          backdrop-filter: blur(8px);
          box-shadow: 0 8px 26px rgba(0,0,0,0.45);
          transition: transform .15s ease, opacity .15s ease;
        }
        .action-btn:active { transform: scale(0.96); }
        .action-btn span {
          font-size: 11px;
          opacity: 0.95;
          font-weight: 700;
        }
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .deal-content {
          position: relative;
          flex: 1;
          padding: 12px 78px 18px 14px;
          overflow: auto;
        }

        .deal-title {
          font-size: 19px;
          font-weight: 900;
          line-height: 1.22;
          margin: 0;
          text-shadow: 0 8px 22px rgba(0, 0, 0, 0.65);
        }

        .deal-price {
          margin-top: 6px;
          font-size: 14px;
          opacity: 0.95;
          font-weight: 800;
        }

        .deal-summary {
          margin-top: 8px;
          font-size: 13px;
          line-height: 1.48;
          color: rgba(255,255,255,0.84);
          max-height: 6.5em;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 5;
          -webkit-box-orient: vertical;
        }

        .deal-metrics {
          margin-top: 12px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .metric {
          background: rgba(12,16,28,0.75);
          border: 1px solid rgba(255,255,255,0.12);
          padding: 10px;
          border-radius: 12px;
          min-width: 95px;
          backdrop-filter: blur(6px);
        }

        .metric-title {
          font-size: 12px;
          opacity: 0.8;
        }

        .metric-value {
          font-weight: 900;
          margin-top: 4px;
        }

        .metric-value.green { color: #00e389; }
        .metric-value.orange { color: #ffbb55; }
      `}</style>
    </div>
  );
}
