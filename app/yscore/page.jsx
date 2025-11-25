"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import YScorePanel from "@/components/yscore_panel"; // tu l'as déjà

export default function YScorePage() {
  const router = useRouter();
  const [targetUrl, setTargetUrl] = useState("");
  const [yscore, setYscore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ✅ récupère ?url=... côté client (pas useSearchParams => pas de bug SSR)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const u = sp.get("url") || "";
    setTargetUrl(u);
  }, []);

  // ✅ lance l’analyse quand url dispo
  useEffect(() => {
    if (!targetUrl) return;

    setLoading(true);
    setErr("");
    fetch(`/api/yscore?url=${encodeURIComponent(targetUrl)}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d?.ok) throw new Error(d?.error || "Analyse impossible");
        setYscore(d.yscore || d);
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
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
      {err && <div className="error">Erreur: {err}</div>}

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
          display:flex;
          align-items:center;
          gap:10px;
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
        .loading{ color:#aeb6cc; margin-top:20px; }
        .error{
          margin-top:12px;
          background:rgba(255,107,107,0.12);
          border:1px solid rgba(255,107,107,0.4);
          padding:10px;
          border-radius:12px;
          font-size:14px;
        }
        .panel{ margin-top:12px; }
      `}</style>
    </div>
  );
}
