"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// si tu as déjà ce composant :
import YScorePanel from "@/components/yscore_panel";

function YScoreInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const url = sp.get("url") || "";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const cleanUrl = useMemo(() => url.trim(), [url]);

  useEffect(() => {
    if (!cleanUrl) return;

    setLoading(true);
    setErr(null);

    fetch(`/api/yscore?url=${encodeURIComponent(cleanUrl)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d?.ok) throw new Error(d?.error || "Analyse impossible");
        setData(d);
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [cleanUrl]);

  return (
    <div className="wrap">
      <header className="top">
        <button onClick={() => router.back()} className="back">←</button>
        <h1>Analyse Y-Score</h1>
      </header>

      {!cleanUrl && (
        <div className="empty">
          Aucun lien à analyser.
          <div className="hint">Reviens sur un deal et clique “Analyse”.</div>
        </div>
      )}

      {loading && <div className="loading">Analyse en cours…</div>}
      {err && <div className="error">❌ {err}</div>}

      {!loading && !err && data && (
        <div className="panel">
          {/* si ton composant existe */}
          {YScorePanel ? (
            <YScorePanel data={data} url={cleanUrl} />
          ) : (
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      )}

      <style jsx>{`
        .wrap {
          min-height: 100svh;
          background: #07090f;
          color: white;
          padding: 14px 14px 90px;
        }
        .top {
          position: sticky;
          top: 0;
          z-index: 5;
          background: #07090f;
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 10px;
        }
        .back {
          background: #0e1322;
          border: 1px solid #1a2340;
          color: white;
          border-radius: 10px;
          padding: 6px 10px;
          font-size: 16px;
        }
        h1 {
          margin: 0;
          font-size: 18px;
          font-weight: 900;
        }
        .loading, .empty, .error {
          margin-top: 30px;
          text-align: center;
          color: #aeb6cc;
          font-weight: 700;
        }
        .error { color: #ff6b6b; }
        .hint { margin-top: 6px; font-size: 12px; opacity: .8; }
        .panel {
          margin-top: 12px;
          background: #0f1422;
          border: 1px solid #1b2440;
          border-radius: 14px;
          padding: 12px;
        }
      `}</style>
    </div>
  );
}

export default function YScorePage() {
  // ✅ Suspense obligatoire avec useSearchParams en build Vercel
  return (
    <Suspense fallback={<div style={{padding:20, color:"#aeb6cc"}}>Chargement…</div>}>
      <YScoreInner />
    </Suspense>
  );
}
