"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

export default function DealSlide({ item, active }) {
  const {
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
    link, // <= Dealabs
    affiliateUrl,
    halal,
  } = item || {};

  // On choisit le bon lien
  const finalUrl = useMemo(
    () => affiliateUrl || url || link || null,
    [affiliateUrl, url, link]
  );

  // Image cassée → fallback
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
          category,
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

  const onAnalyze = () => {
    console.log("Analyze:", item);
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

  const onFav = () => {
    console.log("Fav:", item);
  };

  return (
    <div className="deal-slide">
      {/* Media background */}
      <div className="deal-media">
        {finalImage ? (
          <Image
            src={finalImage}
            alt={title}
            fill
            priority={active}
            sizes="100vw"
            onError={() => setImgOk(false)}
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div className="deal-media-fallback">
            {image ? "Image indisponible" : "PHOTO / MINI-VIDÉO"}
          </div>
        )}
        <div className="deal-gradient" />
      </div>

      {/* Top chips */}
      <div className="deal-top">
        {score != null && <div className="deal-chip">Y-Score {score}</div>}
        {category && <div className="deal-chip">{category}</div>}
        {city && <div className="deal-chip">{city}</div>}
        {halal != null && (
          <div className="deal-chip">{halal ? "Halal ✅" : "Non Halal ⚠️"}</div>
        )}
      </div>

      {/* Right actions */}
      <div className="deal-actions">
        <button className="action-btn" onClick={onFav}>
          ❤️<span>Favori</span>
        </button>
        <button className="action-btn" onClick={onShare}>
          📤<span>Partager</span>
        </button>
        <button className="action-btn" onClick={onAnalyze}>
          🧠<span>Analyse</span>
        </button>
        <button className="action-btn" onClick={onSee} disabled={!finalUrl}>
          🔗<span>Voir</span>
        </button>
      </div>

      {/* Bottom infos */}
      <div className="deal-bottom">
        <h2 className="deal-title">{title}</h2>
        {price && <p className="deal-price">Prix: {price}</p>}

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
        }

        .deal-media {
          position: absolute;
          inset: 0;
          background: #0b1020;
        }
        .deal-media-fallback {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          opacity: 0.6;
        }
        .deal-gradient {
          position: absolute;
          inset: 0;
          background: radial-gradient(
              900px 600px at 50% 0%,
              rgba(0, 0, 0, 0.15),
              transparent 55%
            ),
            linear-gradient(
              180deg,
              rgba(0, 0, 0, 0.05),
              rgba(0, 0, 0, 0.85)
            );
        }

        .deal-top {
          position: absolute;
          top: 72px;
          left: 14px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          z-index: 2;
        }
        .deal-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0.35rem 0.6rem;
          border-radius: 999px;
          font-weight: 700;
          font-size: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.45);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        }

        .deal-actions {
          position: absolute;
          right: 10px;
          bottom: 150px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 2;
        }
        .action-btn {
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #fff;
          border-radius: 14px;
          padding: 10px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-size: 18px;
          min-width: 56px;
          backdrop-filter: blur(6px);
        }
        .action-btn span {
          font-size: 11px;
          opacity: 0.9;
          font-weight: 600;
        }
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .deal-bottom {
          position: absolute;
          left: 14px;
          right: 78px;
          bottom: 90px;
          z-index: 2;
        }
        .deal-title {
          font-size: 20px;
          font-weight: 800;
          line-height: 1.15;
          text-shadow: 0 6px 18px rgba(0, 0, 0, 0.8);
        }
        .deal-price {
          margin-top: 6px;
          font-size: 14px;
          opacity: 0.9;
        }

        .deal-metrics {
          margin-top: 10px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .metric {
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 10px;
          border-radius: 12px;
          min-width: 95px;
        }
        .metric-title {
          font-size: 12px;
          opacity: 0.8;
        }
        .metric-value {
          font-weight: 800;
          margin-top: 4px;
        }
        .metric-value.green {
          color: #00e389;
        }
        .metric-value.orange {
          color: #ffbb55;
        }
      `}</style>
    </div>
  );
}
