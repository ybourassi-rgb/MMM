"use client";

export default function YScorePanel({ url, data }) {
  const score = data?.score ?? data?.yscore ?? null;
  const margin = data?.margin ?? null;
  const risk = data?.risk ?? null;
  const horizon = data?.horizon ?? null;
  const summary = data?.summary ?? data?.reason ?? null;

  return (
    <div className="panel">
      <div className="url">{url}</div>

      <div className="kpis">
        <div className="kpi">
          <div className="t">Y-Score</div>
          <div className="v">{score ?? "—"}</div>
        </div>
        <div className="kpi">
          <div className="t">Marge</div>
          <div className="v green">{margin ?? "—"}</div>
        </div>
        <div className="kpi">
          <div className="t">Risque</div>
          <div className="v orange">{risk ?? "—"}</div>
        </div>
        <div className="kpi">
          <div className="t">Horizon</div>
          <div className="v">{horizon ?? "—"}</div>
        </div>
      </div>

      {summary && <div className="summary">{summary}</div>}

      <style jsx>{`
        .panel {
          background: #0f1422;
          border: 1px solid #1b2440;
          border-radius: 14px;
          padding: 12px;
          display: grid;
          gap: 10px;
        }
        .url {
          font-size: 12px;
          color: #aeb6cc;
          word-break: break-all;
        }
        .kpis {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .kpi {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 10px;
          display: grid;
          gap: 4px;
        }
        .t { font-size: 11px; color: #aeb6cc; font-weight: 700; }
        .v { font-size: 18px; font-weight: 900; }
        .v.green { color: #00e389; }
        .v.orange { color: #ffbb55; }
        .summary {
          font-size: 13px;
          line-height: 1.5;
          color: #e9ecf5;
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}
