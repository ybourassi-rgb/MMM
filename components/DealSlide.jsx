"use client";

import Image from "next/image";
import { useMemo, useState, useEffect } from "react";

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

    // ✅ enchères (nouveaux champs possibles)
    type,
    auction,          // bool optionnel
    currentBid,
    startingBid,
    bidCount,
    endsAt,           // timestamp ou ISO
    endAt,            // alias possible
    currentPrice,     // alias possible
    startingPrice,    // alias possible
    bidStep,          // pas d’enchère
    publishedAt,
    bucket,
  } = item || {};

  const finalEndsAt = endsAt || endAt || null;
  const finalCurrent =
    currentBid ?? currentPrice ?? null;
  const finalStart =
    startingBid ?? startingPrice ?? null;

  const isAuction =
    auction === true ||
    type === "auction" ||
    type === "enchere" ||
    finalEndsAt != null ||
    finalCurrent != null ||
    finalStart != null;

  const finalUrl = useMemo(
    () => affiliateUrl || url || link || null,
    [affiliateUrl, url, link]
  );

  const [imgOk, setImgOk] = useState(true);
  const finalImage = imgOk && image ? image : "/placeholders/IMG_2362.png";

  const [fav, setFav] = useState(false);

  // ✅ countdown enchère
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!isAuction || !finalEndsAt) return;

    const end = new Date(finalEndsAt).getTime();
    if (Number.isNaN(end)) return;

    const tick = () => {
      const now = Date.now();
      const d = Math.max(0, end - now);
      const h = Math.floor(d / 3600000);
      const m = Math.floor((d % 3600000) / 60000);
      const s = Math.floor((d % 60000) / 1000);

      if (d <= 0) {
        setTimeLeft("Terminé");
      } else if (h > 0) {
        setTimeLeft(`${h}h ${m}m`);
      } else {
        setTimeLeft(`${m}m ${s}s`);
      }
    };

    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [isAuction, finalEndsAt]);

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
          bucket,
          url: finalUrl,
          image,
          source,
          isAuction,
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
          bucket,
          source,
          isAuction,
        }),
      });
    } catch {}
  };

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

  // ✅ Miser (vraie enchère)
  const onBid = async () => {
    const step = Number(bidStep || 1);
    const curr = Number(finalCurrent ?? finalStart ?? 0);
    const min = curr + step;

    const val = prompt(`Ta mise (min ${min}):`, String(min));
    if (!val) return;

    const amount = Number(val);
    if (!Number.isFinite(amount) || amount < min) {
      alert("Mise trop basse ❌");
      return;
    }

    try {
      const r = await fetch("/api/auctions/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          amount,
          bidder: "user", // plus tard profil
        }),
      });

      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "bid_failed");

      alert("Mise enregistrée ✅");
      // refresh simple pour voir le nouveau prix
      window.location.reload();
    } catch (e) {
      alert("Erreur enchère: " + e.message);
    }
  };

  const displayPrice =
    isAuction
      ? (finalCurrent != null
          ? `Enchère: ${finalCurrent} €`
          : finalStart != null
            ? `Départ: ${finalStart} €`
            : null
        )
      : price
        ? `Prix: ${price}`
        : null;

  return (
    <div className="deal-slide">
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
          {isAuction && <div className="deal-chip auction">⏳ Enchère</div>}
          {score != null && !isAuction && (
            <div className="deal-chip score">Y-Score {score}</div>
          )}
          {category && <div className="deal-chip">{category}</div>}
          {city && <div className="deal-chip">📍 {city}</div>}
          {isAuction && timeLeft && (
            <div className="deal-chip time">Fin: {timeLeft}</div>
          )}
        </div>
      </div>

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

        {/* ✅ bouton adapté enchère */}
        <button
          className="action-btn"
          onClick={isAuction ? onBid : onSee}
          disabled={!finalUrl && !isAuction}
        >
          {isAuction ? "🔨" : "🔗"}
          <span>{isAuction ? "Miser" : "Voir"}</span>
        </button>
      </div>

      <div className="deal-content">
        <h2 className="deal-title">{title}</h2>

        {!!displayPrice && <p className="deal-price">{displayPrice}</p>}
        {isAuction && bidCount != null && (
          <p className="deal-sub">Offres: {bidCount}</p>
        )}

        {summary && <p className="deal-summary">{summary}</p>}

        <div className="deal-metrics">
          {!isAuction && margin && (
            <div className="metric">
              <div className="metric-title">Marge</div>
              <div className="metric-value green">{margin}</div>
            </div>
          )}

          {!isAuction && risk && (
            <div className="metric">
              <div className="metric-title">Risque</div>
              <div className="metric-value orange">{risk}</div>
            </div>
          )}

          {!isAuction && horizon && (
            <div className="metric">
              <div className="metric-title">Horizon</div>
              <div className="metric-value">{horizon}</div>
            </div>
          )}

          {isAuction && finalEndsAt && (
            <div className="metric">
              <div className="metric-title">Fin enchère</div>
              <div className="metric-value">
                {new Date(finalEndsAt).toLocaleString()}
              </div>
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
            radial-gradient(900px 600px at 50% 0%, rgba(0,0,0,0.15), transparent 55%),
            linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.7));
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
          padding: 0.35rem 0.7rem;
          border-radius: 999px;
          font-weight: 800;
          font-size: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(10,14,25,0.7);
          box-shadow: 0 6px 22px rgba(0,0,0,0.35);
          backdrop-filter: blur(6px);
        }
        .deal-chip.score {
          background: linear-gradient(90deg, rgba(78,163,255,0.25), rgba(34,230,165,0.2));
          border-color: rgba(78,163,255,0.5);
        }
        .deal-chip.auction {
          background: linear-gradient(90deg, rgba(255,180,84,0.25), rgba(255,107,107,0.18));
          border-color: rgba(255,180,84,0.6);
        }
        .deal-chip.time {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.18);
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
          background: rgba(12,16,28,0.7);
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
          box-shadow: 0 8px 26px rgba(0,0,0,0.4);
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
          line-height: 1.2;
          margin: 0;
          text-shadow: 0 6px 18px rgba(0, 0, 0, 0.6);
        }

        .deal-price {
          margin-top: 6px;
          font-size: 14px;
          opacity: 0.95;
          font-weight: 800;
        }
        .deal-sub {
          font-size: 12px;
          opacity: 0.75;
          margin-top: 2px;
          font-weight: 700;
        }

        .deal-summary {
          margin-top: 8px;
          font-size: 13px;
          line-height: 1.45;
          color: rgba(255,255,255,0.82);
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
          background: rgba(12,16,28,0.7);
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
          font-size: 13px;
        }

        .metric-value.green { color: #00e389; }
        .metric-value.orange { color: #ffbb55; }
      `}</style>
    </div>
  );
}
