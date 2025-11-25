"use client";

import { useMemo } from "react";

export default function YScorePanel({ data, url }) {
  const s = data || {};

  // compat multi-formats
  const global = s.globalScore ?? s.score ?? s.global ?? s.yscore ?? null;
  const risk = s.riskScore ?? s.risk ?? null;
  const opp = s.opportunityScore ?? s.opportunity ?? s.margin ?? null;
  const horizon = s.horizon ?? s.timeHorizon ?? s.term ?? null;
  const reasoning = s.reasoning ?? s.explanation ?? s.why ?? "";

  const fmt = (v) =>
    v == null || Number.isNaN(Number(v)) ? null : Math.round(Number(v));

  const g = fmt(global);
  const r = fmt(risk);
  const o = fmt(opp);

  const badge = useMemo(() => {
    if (g == null) return { label: "Analyse partielle", tone: "partial" };
    if (g >= 80) return { label: "🔥 Top deal", tone: "top" };
    if (g >= 60) return { label: "✅ Bon plan", tone: "good" };
    if (g >= 40) return { label: "⚠️ Moyen", tone: "mid" };
    return { label: "❌ Risqué", tone: "bad" };
  }, [g]);

  const Bar = ({ label, value, tone = "neutral" }) => {
    const v = value == null ? 0 : Math.max(0, Math.min(100, value));
    return (
      <div className={`bar ${tone}`}>
        <div className="bar-top">
          <span>{label}</span>
          <b>{value == null ? "—" : v}</b>
        </div>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${v}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="ys-wrap">
      <div className="ys-card">
        <div className="ys-head">
          <div className="ys-head-left">
            <div className="ys-title">Résultat Y-Score</div>
            {url && (
              <div className="ys-url">
                {url.length > 58 ? url.slice(0, 58) + "..." : url}
              </div>
            )}
          </div>

          <div className={`ys-badge ${badge.tone}`}>
            {badge.label}
          </div>
        </div>

        {/* SCORE GLOBAL */}
        <div className="ys-main">
          <div className="ys-main-title">Score global</div>
          <div className="ys-main-score">
            {g == null ? "—" : g}
            <span>/100</span>
          </div>

          {/* mini barre sous le score global */}
          <div className="ys-main-bar">
            <div
              className={`ys-main-fill ${badge.tone}`}
              style={{ width: `${g == null ? 0 : g}%` }}
            />
          </div>
        </div>

        {/* 3 KPIs premium */}
        <div className="ys-row">
          <Bar label="Potentiel" value={o} tone="good" />
          <Bar label="Risque" value={r} tone="warn" />
          <div className="mini horizon">
            <div className="mini-top">
              <span>Horizon</span>
              <b>{horizon || "—"}</b>
            </div>
            <div className="mini-sub">
              {horizon ? "Durée estimée" : "Non défini"}
            </div>
          </div>
        </div>

        {!!reasoning && (
          <div className="ys-reason">
            <div className="ys-reason-title">Pourquoi ?</div>
            <div className="ys-reason-text">{reasoning}</div>
          </div>
        )}
      </div>

      <style jsx>{`
        .ys-wrap {
          width: 100%;
          padding: 6px 2px;
        }

        .ys-card {
          background:
            radial-gradient(1200px 600px at 50% -30%, rgba(78,163,255,0.14), transparent 60%),
            radial-gradient(900px 500px at 90% 120%, rgba(34,230,165,0.08), transparent 60%),
            rgba(15,20,34,0.95);
          border: 1px solid rgba(78,163,255,0.22);
          border-radius: 20px;
          padding: 14px;
          box-shadow:
            0 18px 60px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(255,255,255,0.05);
          backdrop-filter: blur(6px);
        }

        .ys-head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .ys-head-left { min-width: 0; }

        .ys-title {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 0.2px;
        }

        .ys-url {
          font-size: 11px;
          opacity: 0.7;
          margin-top: 4px;
          word-break: break-all;
        }

        .ys-badge {
          flex: 0 0 auto;
          font-size: 11px;
          font-weight: 900;
          padding: 6px 9px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          white-space: nowrap;
        }
        .ys-badge.top {
          background: rgba(0,227,137,0.12);
          border-color: rgba(0,227,137,0.45);
          color: #dfffea;
        }
        .ys-badge.good {
          background: rgba(78,163,255,0.12);
          border-color: rgba(78,163,255,0.45);
          color: #e6f2ff;
        }
        .ys-badge.mid {
          background: rgba(255,187,85,0.12);
          border-color: rgba(255,187,85,0.45);
          color: #fff3df;
        }
        .ys-badge.bad {
          background: rgba(255,107,107,0.12);
          border-color: rgba(255,107,107,0.45);
          color: #ffe3e3;
        }
        .ys-badge.partial {
          opacity: 0.9;
        }

        .ys-main {
          background: rgba(0,0,0,0.38);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 14px;
          text-align: center;
          margin-bottom: 10px;
        }
        .ys-main-title {
          font-size: 12px;
          opacity: 0.8;
          font-weight: 800;
          letter-spacing: .3px;
        }
        .ys-main-score {
          margin-top: 6px;
          font-size: 38px;
          font-weight: 900;
          line-height: 1;
          letter-spacing: 0.5px;
        }
        .ys-main-score span {
          font-size: 14px;
          opacity: 0.8;
          margin-left: 4px;
          font-weight: 800;
        }
        .ys-main-bar {
          margin-top: 10px;
          height: 8px;
          background: rgba(255,255,255,0.06);
          border-radius: 999px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .ys-main-fill {
          height: 100%;
          border-radius: 999px;
          background: rgba(255,255,255,0.25);
          transition: width .4s ease;
        }
        .ys-main-fill.top { background: linear-gradient(90deg, #00e389, #22e6a5); }
        .ys-main-fill.good { background: linear-gradient(90deg, #4ea3ff, #6d7bff); }
        .ys-main-fill.mid { background: linear-gradient(90deg, #ffbb55, #ffd38a); }
        .ys-main-fill.bad { background: linear-gradient(90deg, #ff6b6b, #ff9a9a); }

        .ys-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .bar, .mini {
          background: rgba(0,0,0,0.38);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 12px;
        }

        .bar-top, .mini-top {
          display:flex;
          justify-content:space-between;
          align-items:center;
          font-size:12px;
          opacity:.9;
          font-weight:800;
        }

        .bar-top b, .mini-top b {
          font-size:14px;
          font-weight:900;
        }

        .bar-track {
          margin-top:8px;
          height:7px;
          background: rgba(255,255,255,0.06);
          border-radius: 999px;
          overflow:hidden;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .bar-fill {
          height: 100%;
          border-radius: 999px;
          background: rgba(255,255,255,0.25);
          transition: width .4s ease;
        }

        .bar.good .bar-fill { background: linear-gradient(90deg, #00e389, #22e6a5); }
        .bar.warn .bar-fill { background: linear-gradient(90deg, #ffbb55, #ffd38a); }

        .mini-sub {
          margin-top:8px;
          font-size:11px;
          opacity:.65;
          font-weight:700;
        }

        .ys-reason {
          margin-top: 12px;
          background: rgba(0,0,0,0.38);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 12px;
        }
        .ys-reason-title {
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 6px;
          opacity: 0.95;
        }
        .ys-reason-text {
          font-size: 13px;
          line-height: 1.55;
          opacity: 0.92;
        }
      `}</style>
    </div>
  );
}
