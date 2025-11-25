"use client";

import { useMemo } from "react";

export default function YScorePanel({ data, url }) {
  // data peut venir sous plusieurs formes => on normalise
  const y = data?.yscore || data || {};

  const score = y.score ?? y.total ?? y.value ?? null;
  const margin = y.margin ?? y.profit ?? null;
  const risk = y.risk ?? y.risque ?? null;
  const horizon = y.horizon ?? y.term ?? null;
  const notes = y.notes ?? y.explain ?? y.summary ?? null;

  const badge = useMemo(() => {
    if (score == null) return { label: "Analyse partielle", cls: "muted" };
    if (score >= 80) return { label: "🔥 Exceptionnel", cls: "good" };
    if (score >= 60) return { label: "✅ Très bon", cls: "good" };
    if (score >= 40) return { label: "⭐ Correct", cls: "warn" };
    return { label: "⚠️ Risqué", cls: "bad" };
  }, [score]);

  return (
    <div className="panel">
      <div className="head">
        <div>
          <div className="title">Résultat Y-Score</div>
          {url && (
            <div className="url" title={url}>
              {url}
            </div>
          )}
        </div>
        <div className={`badge ${badge.cls}`}>{badge.label}</div>
      </div>

      <div className="scoreBox">
        <div className="scoreLabel">Score global</div>
        <div className="scoreValue">{score ?? "—"}</div>
        <div className="scoreHint">/100</div>
      </div>

      <div className="grid">
        <Metric label="Marge" value={margin} tone="green" />
        <Metric label="Risque" value={risk} tone="orange" />
        <Metric label="Horizon" value={horizon} />
      </div>

      {notes && (
        <div className="notes">
          <div className="notesTitle">Analyse IA</div>
          <div className="notesText">{String(notes)}</div>
        </div>
      )}

      <style jsx>{`
        .panel {
          background: #0f1422;
          border: 1px solid #1b2440;
          border-radius: 16px;
          padding: 14px;
          display: grid;
          gap: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.55);
        }
        .head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
        }
        .title {
          font-weight: 900;
          font-size: 17px;
        }
        .url {
          font-size: 11px;
          color: #aeb6cc;
          max-width: 62vw;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-top: 2px;
        }
        .badge {
          font-size: 11px;
          font-weight: 900;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
        }
        .badge.good { border-color: rgba(0,227,137,0.5); color: #00e389; }
        .badge.warn { border-color: rgba(255,180,84,0.5); color: #ffb454; }
        .badge.bad  { border-color: rgba(255,107,107,0.55); color: #ff6b6b; }
        .badge.muted { color:#aeb6cc; }

        .scoreBox {
          background: radial-gradient(300px 120px at 50% 0, rgba(78,163,255,0.12), transparent 70%), #0b1020;
          border: 1px solid #1b2440;
          border-radius: 14px;
          padding: 14px;
          text-align: center;
        }
        .scoreLabel { font-size: 12px; color:#aeb6cc; font-weight: 800; }
        .scoreValue { font-size: 42px; font-weight: 1000; letter-spacing: .5px; }
        .scoreHint { font-size: 11px; color:#8b93a7; font-weight: 700; margin-top: -2px; }

        .grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 8px;
        }
        .notes {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 10px;
        }
        .notesTitle {
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 6px;
        }
        .notesText {
          font-size: 13px;
          line-height: 1.5;
          color: rgba(255,255,255,0.9);
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div className={`m ${tone || ""}`}>
      <div className="l">{label}</div>
      <div className="v">{value ?? "—"}</div>
      <style jsx>{`
        .m{
          background:#0b1020;
          border:1px solid #1b2440;
          border-radius:12px;
          padding:10px;
          display:grid;
          gap:4px;
          text-align:center;
        }
        .l{ font-size:12px; color:#aeb6cc; font-weight:800; }
        .v{ font-size:15px; font-weight:900; }
        .green .v{ color:#00e389; }
        .orange .v{ color:#ffb454; }
      `}</style>
    </div>
  );
}
