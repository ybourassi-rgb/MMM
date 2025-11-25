"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import YScorePanel from "@/components/yscore_panel";

export default function YScorePage() {
  const router = useRouter();
  const [targetUrl, setTargetUrl] = useState("");
  const [yscore, setYscore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ✅ récupère ?url=... côté client
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const u = sp.get("url") || "";
    setTargetUrl(u);
  }, []);

  // ✅ lance l’analyse quand url dispo
  useEffect(() => {
    if (!targetUrl) return;

    const run = async () => {
      setLoading(true);
      setErr("");
      setYscore(null);
      try {
        const res = await fetch(
          `/api/yscore?url=${encodeURIComponent(targetUrl)}`,
          { cache: "no-store" }
        );
        const d = await res.json();

        if (!d?.ok) throw new Error(d?.error || "Analyse impossible");
        setYscore(d.yscore || d);
      } catch (e) {
        setErr(e.message || "Erreur analyse");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [targetUrl]);

  return (
    <div className="wrap">
      <header className="top">
        <button onClick={() => router.back()} className="back">←</button>
        <h1>Analyse Y-Score</h1>
      </header>

      {!targetUrl && (
        <div className="muted">
          Aucun lien à analyser. Reviens sur un deal et clique “Analyse”.
        </div>
      )}

      {loading && <div className="loading">Analyse en cours…</div>}

      {err && (
        <div className="error">
          Erreur: {err}
          <button
            className="retry"
            onClick={() => setTargetUrl((u) => u)} // retrigger effect
          >
            Réessayer
          </button>
        </div>
      )}

      {!!yscore && (
        <div className="panel">
          <YScorePanel data={yscore} url={targetUrl} />
        </div>
      )}

      <style jsx>{`
        .wrap{
          min-height:100svh;
          background:#07090f;
          color:white;
          padding:14px 14px 90px;
        }
        .top{
          position: sticky;
          top: 0;
          z-index: 5;
          background:#07090f;
          display:flex;
          align-items:center;
          gap:10px;
          padding-bottom:10px;
          margin-bottom:12px;
        }
        .back{
          background:#0e1322;
          border:1px solid #1a2340;
          color:white;
          border-radius:10px;
          padding:6px 10px;
          font-size:16px;
        }
        h1{
          margin:0;
          font-size:18px;
          font-weight:900;
        }
        .muted{ color:#aeb6cc; font-size:14px; }

        .loading{
          color:#aeb6cc;
          margin-top:20px;
          font-size:14px;
        }

        .error{
          margin-top:12px;
          background:rgba(255,107,107,0.12);
          border:1px solid rgba(255,107,107,0.4);
          padding:10px;
          border-radius:12px;
          font-size:14px;
          display:grid;
          gap:8px;
        }
        .retry{
          width: fit-content;
          background:#1a2340;
          border:1px solid #27406f;
          color:white;
          border-radius:10px;
          padding:6px 10px;
          font-weight:800;
          font-size:12px;
        }

        .panel{ margin-top:12px; }
      `}</style>
    </div>
  );
}
