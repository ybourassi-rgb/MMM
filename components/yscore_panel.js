"use client";

import { useMemo } from "react";

export default function YScorePanel({ data, url }) {
  const s = data || {};

  // compat multi-formats
  const global =
    s.globalScore ?? s.score ?? s.global ?? s.yscore ?? null;

  const risk =
    s.riskScore ?? s.risk ?? null;

  const opp =
    s.opportunityScore ?? s.opportunity ?? s.margin ?? null;

  // horizon peut venir en texte (court terme etc.)
  const horizon =
    s.horizon ?? s.timeHorizon ?? s.term ?? null;

  const reasoning =
    s.reasoning ?? s.explanation ?? s.why ?? "";

  // badges simples
  const badge = useMemo(() => {
    if (global == null) return "Analyse partielle";
    if (global >= 80) return "🔥 Top deal";
    if (global >= 60) return "✅ Bon plan";
    if (global >= 40) return "⚠️ Moyen";
    return "❌ Risqué";
  }, [global]);

  const fmt = (v) =>
    v == null || Number.isNaN(Number(v)) ? "—" : Math.round(Number(v));

  return (
    <div className="ys-wrap">
      <div className="ys-card">
        <div className="ys-head">
          <div>
            <div className="ys-title">Résultat Y-Score</div>
            {url && (
              <div className="ys-url">
                {url.length > 52 ? url.slice(0, 52) + "..." : url}
              </div>
            )}
          </div>
          <div className="ys-badge">{badge}</div>
        </div>

        <div className="ys-main">
          <div className="ys-main-title">Score global</div>
          <div className="ys-main-score">
            {fmt(global)}
            <span>/100</span>
          </div>
        </div>

        <div className="ys-row">
          <div className="ys-mini green">
            <div className="ys-mini-title">Potentiel</div>
            <div className="ys-mini-score">{fmt(opp)}</div>
          </div>

          <div className="ys-mini orange">
            <div className="ys-mini-title">Risque</div>
            <div className="ys-mini-score">{fmt(risk)}</div>
          </div>

          <div className="ys-mini">
            <div className="ys-mini-title">Horizon</div>
            <div className="ys-mini-score">
              {horizon || "—"}
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
          background: radial-gradient(
              1000px 500px at 50% -20%,
              rgba(78, 163, 255, 0.12),
              transparent 60%
            ),
            #0f1422;
          border: 1px solid rgba(78, 163, 255, 0.22);
          border-radius: 18px;
          padding: 14px;
          box-shadow: 0 15px 45px rgba(0, 0, 0, 0.55);
        }

        .ys-head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: flex-start;
          margin-bottom: 12px;
        }

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
          font-size: 11px;
          font-weight: 900;
          padding: 6px 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .ys-main {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 14px;
          text-align: center;
          margin-bottom: 10px;
        }
        .ys-main-title {
          font-size: 12px;
          opacity: 0.8;
          font-weight: 700;
        }
        .ys-main-score {
          margin-top: 6px;
          font-size: 36px;
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

        .ys-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .ys-mini {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 12px;
          text-align: center;
        }
        .ys-mini-title {
          font-size: 12px;
          opacity: 0.8;
          font-weight: 800;
        }
        .ys-mini-score {
          margin-top: 6px;
          font-size: 18px;
          font-weight: 900;
        }
        .ys-mini.green .ys-mini-score {
          color: #00e389;
        }
        .ys-mini.orange .ys-mini-score {
          color: #ffbb55;
        }

        .ys-reason {
          margin-top: 12px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 12px;
        }
        .ys-reason-title {
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 6px;
          opacity: 0.9;
        }
        .ys-reason-text {
          font-size: 13px;
          line-height: 1.5;
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}
