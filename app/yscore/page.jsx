"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function YScorePage() {
  const sp = useSearchParams();
  const router = useRouter();
  const url = sp.get("url");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    fetch(`/api/yscore?url=${encodeURIComponent(url)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [url]);

  return (
    <div className="wrap">
      <header className="top">
        <button onClick={() => router.back()} className="back">←</button>
        <h1>Analyse Y-Score</h1>
      </header>

      {!url && <div className="muted">Aucun lien à analyser.</div>}

      {loading && url && <div className="muted">Analyse en cours…</div>}

      {!loading && data && (
        <div className="card">
          <div className="bigScore">
            {data.globalScore ?? data.score ?? "—"}
          </div>
          <div className="sub">Score global</div>

          <div className="grid">
            <div className="k">
              <div className="t">Opportunité</div>
              <div className="v good">{data.opportunityScore ?? "—"}</div>
            </div>
            <div className="k">
              <div className="t">Risque</div>
              <div className="v warn">{data.riskScore ?? "—"}</div>
            </div>
            <div className="k">
              <div className="t">Horizon</div>
              <div className="v">{data.horizon ?? "court terme"}</div>
            </div>
          </div>

          {data.summary && (
            <p className="summary">{data.summary}</p>
          )}
        </div>
      )}

      <style jsx>{`
        .wrap {
          min-height: 100svh;
          background: #07090f;
          color: #fff;
          padding: 14px 14px 90px;
        }
        .top {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }
        .back {
          background: #0e1322;
          border: 1px solid #1a2340;
          color: white;
          border-radius: 10px;
          padding: 6px 10px;
          font-size: 16px;
        }
        h1 { margin: 0; font-size: 18px; font-weight: 900; }

        .muted {
          text-align: center;
          color: #aeb6cc;
          margin-top: 30px;
        }

        .card {
          background: #0f1422;
          border: 1px solid #1b2440;
          border-radius: 16px;
          padding: 16px;
          display: grid;
          gap: 10px;
        }

        .bigScore {
          font-size: 44px;
          font-weight: 900;
          text-align: center;
          background: linear-gradient(90deg,#4ea3ff,#22e6a5);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .sub {
          text-align: center;
          font-size: 12px;
          opacity: .8;
          margin-top: -6px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 8px;
          margin-top: 6px;
        }
        .k {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 10px;
          text-align: center;
        }
        .t { font-size: 11px; color:#aeb6cc; font-weight:700; }
        .v { font-size: 18px; font-weight:900; margin-top:4px; }
        .v.good { color:#00e389; }
        .v.warn { color:#ffbb55; }

        .summary {
          font-size: 13px;
          line-height: 1.5;
          color: rgba(255,255,255,0.85);
        }
      `}</style>
    </div>
  );
}
