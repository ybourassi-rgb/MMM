"use client";

import { useMemo } from "react";

export default function AnalyzeSheet({ item, open, onClose }) {
  const {
    title,
    price,
    score,
    margin,
    risk,
    horizon,
    summary,
    category,
    source,
    city,
  } = item || {};

  // petit texte auto simple (pas d’IA pour l’instant)
  const verdict = useMemo(() => {
    const s = Number(score || 0);
    if (s >= 80) return "🔥 Super opportunité : marge/rentabilité très solide.";
    if (s >= 60) return "✅ Bonne affaire : intéressant si tu en as besoin maintenant.";
    if (s >= 40) return "⚠️ Moyen : à comparer avec d’autres offres avant d’acheter.";
    return "❌ Peu intéressant : risque ou prix pas top.";
  }, [score]);

  if (!open) return null;

  return (
    <div className="sheetRoot" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="handle" />

        <header className="head">
          <h3>Analyse rapide</h3>
          <button onClick={onClose} className="close">✕</button>
        </header>

        <div className="title">{title}</div>
        {summary && <p className="summary">{summary}</p>}

        <div className="grid">
          {price && <div className="box"><span>Prix</span><b>{price}</b></div>}
          {score != null && <div className="box"><span>Y-Score</span><b>{score}</b></div>}
          {margin && <div className="box"><span>Marge</span><b className="good">{margin}</b></div>}
          {risk && <div className="box"><span>Risque</span><b className="warn">{risk}</b></div>}
          {horizon && <div className="box"><span>Horizon</span><b>{horizon}</b></div>}
          {category && <div className="box"><span>Catégorie</span><b>{category}</b></div>}
          {city && <div className="box"><span>Ville</span><b>{city}</b></div>}
          {source && <div className="box"><span>Source</span><b>{source}</b></div>}
        </div>

        <div className="verdict">{verdict}</div>
      </div>

      <style jsx>{`
        .sheetRoot {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(6px);
          z-index: 9999;
          display: grid;
          align-items: end;
        }

        .sheet {
          background: #0f1422;
          border-top-left-radius: 18px;
          border-top-right-radius: 18px;
          padding: 10px 12px 18px;
          border: 1px solid rgba(255,255,255,0.08);
          animation: up .18s ease;
        }

        @keyframes up {
          from { transform: translateY(20px); opacity: .6; }
          to { transform: translateY(0); opacity: 1; }
        }

        .handle {
          width: 44px; height: 5px; border-radius: 999px;
          background: rgba(255,255,255,0.18);
          margin: 6px auto 8px;
        }

        .head {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 8px;
        }
        h3 { margin: 0; font-size: 16px; font-weight: 900; }
        .close {
          background: transparent; border: none; color: white;
          font-size: 18px; cursor: pointer;
        }

        .title {
          font-weight: 900; font-size: 15px; line-height: 1.25;
          margin-bottom: 6px;
        }
        .summary {
          font-size: 13px; color: rgba(255,255,255,0.8);
          margin: 0 0 10px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        .box {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 10px;
          display: grid; gap: 4px;
          font-size: 12px;
          color: #aeb6cc;
        }
        .box b {
          font-size: 14px; color: white; font-weight: 900;
        }
        .good { color: #00e389; }
        .warn { color: #ffbb55; }

        .verdict {
          margin-top: 10px;
          padding: 10px;
          border-radius: 12px;
          background: rgba(78,163,255,0.08);
          border: 1px solid rgba(78,163,255,0.25);
          font-size: 13px;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
