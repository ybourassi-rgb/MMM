"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AuctionPage({ params }) {
  const router = useRouter();
  const { id } = params;

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`/api/auction/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!d?.ok) throw new Error("Not found");
        setAuction(d.auction);
        setBids(d.bids || []);
      })
      .catch((e) => setErr(e.message));
  }, [id]);

  const remaining = useMemo(() => {
    if (!auction?.endsAt) return 0;
    return Math.max(0, auction.endsAt - Date.now());
  }, [auction]);

  const fmtMs = (ms) => {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  };

  const onBid = async () => {
    try {
      if (!auction) return;
      setLoading(true);
      setErr("");

      const v = Number(amount);
      const res = await fetch("/api/auction/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auctionId: auction.id,
          userId: "anon", // plus tard => vrai user
          amount: v,
        }),
      });
      const d = await res.json();
      if (!d?.ok) {
        throw new Error(d?.error || "Bid failed");
      }
      setAuction(d.auction);
      setBids((prev) => [d.bid, ...prev]);
      setAmount("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (err && !auction) {
    return (
      <div style={{ padding: 16, color: "white" }}>
        <button onClick={() => router.back()}>← Retour</button>
        <p>Enchère introuvable.</p>
      </div>
    );
  }

  if (!auction) {
    return <div style={{ padding: 16, color: "white" }}>Chargement…</div>;
  }

  const minBid = auction.currentPrice + auction.minIncrement;

  return (
    <div className="wrap">
      <header className="top">
        <button onClick={() => router.back()} className="back">←</button>
        <h1>Enchère</h1>
      </header>

      <div className="media">
        <Image
          src={auction.images?.[0] || "/placeholders/IMG_2362.png"}
          alt={auction.title}
          fill
          unoptimized
          style={{ objectFit: "contain" }}
        />
        <div className="badge">ENCHÈRE 🔥</div>
        <div className="timer">⏳ {fmtMs(remaining)}</div>
      </div>

      <h2 className="title">{auction.title}</h2>
      {auction.description && <p className="desc">{auction.description}</p>}

      <div className="pricebox">
        <div>
          <div className="label">Prix actuel</div>
          <div className="price">{auction.currentPrice}€</div>
        </div>
        <div>
          <div className="label">Enchères</div>
          <div className="price">{auction.bidsCount}</div>
        </div>
      </div>

      <div className="bidbox">
        <input
          type="number"
          placeholder={`Min ${minBid}€`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button onClick={onBid} disabled={loading}>
          {loading ? "..." : "Surenchérir"}
        </button>
      </div>

      {err && <div className="err">Erreur: {err}</div>}

      <div className="history">
        <div className="h-title">Historique</div>
        {!bids.length && <div className="muted">Aucune enchère pour l’instant</div>}
        {bids.map((b) => (
          <div key={b.id} className="bidrow">
            <div className="bidamt">{b.amount}€</div>
            <div className="bidmeta">
              par {b.userId} • {new Date(b.ts).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .wrap{ min-height:100svh; background:#07090f; color:white; padding:12px 12px 90px; }
        .top{ display:flex; gap:8px; align-items:center; margin-bottom:10px; }
        .back{ background:#0e1322; border:1px solid #1a2340; color:white; border-radius:10px; padding:6px 10px; }

        .media{ position:relative; height:42vh; background:#0b1020; border-radius:14px; overflow:hidden; }
        .badge{
          position:absolute; top:10px; left:10px; font-weight:900; font-size:12px;
          background:rgba(0,0,0,.6); padding:6px 8px; border-radius:999px;
          border:1px solid rgba(255,255,255,.12);
        }
        .timer{
          position:absolute; bottom:10px; left:10px; font-weight:900; font-size:12px;
          background:rgba(0,0,0,.6); padding:6px 8px; border-radius:999px;
          border:1px solid rgba(255,255,255,.12);
        }

        .title{ font-size:20px; font-weight:900; margin:12px 0 4px; }
        .desc{ opacity:.9; line-height:1.5; }

        .pricebox{
          display:flex; gap:10px; margin-top:10px;
          background:#0f1422; border:1px solid rgba(255,255,255,.08);
          padding:10px; border-radius:12px;
        }
        .label{ font-size:12px; opacity:.7; font-weight:700; }
        .price{ font-size:20px; font-weight:900; margin-top:2px; }

        .bidbox{ display:flex; gap:8px; margin-top:10px; }
        .bidbox input{
          flex:1; background:#0f1422; border:1px solid rgba(255,255,255,.1);
          border-radius:10px; padding:10px; color:white;
        }
        .bidbox button{
          background:#1e2a4a; border:1px solid rgba(78,163,255,.6);
          color:white; border-radius:10px; padding:10px 14px; font-weight:900;
        }

        .err{
          margin-top:8px; background:rgba(255,107,107,.12);
          border:1px solid rgba(255,107,107,.4);
          padding:8px; border-radius:10px; font-size:14px;
        }

        .history{ margin-top:14px; }
        .h-title{ font-weight:900; margin-bottom:6px; }
        .muted{ opacity:.7; font-size:14px; }
        .bidrow{
          padding:8px; border-radius:10px; background:#0f1422;
          border:1px solid rgba(255,255,255,.06); margin-bottom:6px;
        }
        .bidamt{ font-weight:900; font-size:16px; }
        .bidmeta{ font-size:11px; opacity:.7; margin-top:2px; }
      `}</style>
    </div>
  );
}
