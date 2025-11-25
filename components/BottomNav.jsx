"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function BottomNav({ newDealPing = 0 }) {
  const [glow, setGlow] = useState(false);

  // ✅ quand newDealPing change => glow 1.6s
  useEffect(() => {
    if (!newDealPing) return;
    setGlow(true);
    const t = setTimeout(() => setGlow(false), 1600);
    return () => clearTimeout(t);
  }, [newDealPing]);

  return (
    <nav className="bottom-nav">
      <Link href="/" className="nav-item">🏠<span>Accueil</span></Link>
      <Link href="/search" className="nav-item">🔎<span>Recherche</span></Link>

      {/* ✅ FAB Publierrrrrr */}
      <Link
        href="/publier"
        className={`fab ${glow ? "fab-glow" : ""}`}
        aria-label="Publier"
      >
        <div className="fab-inner">
          <div className="fab-plus">＋</div>
          <div className="fab-text">Publier</div>
        </div>
      </Link>

      <Link href="/affiliation" className="nav-item">💰<span>Gains</span></Link>
      <Link href="/profile" className="nav-item">👤<span>Profil</span></Link>

      <style jsx>{`
        .bottom-nav {
          position: fixed;
          left: 10px; right: 10px; bottom: 10px;
          height: 72px;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          align-items: center;
          background: rgba(8,12,22,0.9);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          backdrop-filter: blur(10px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.6);
          z-index: 20;
        }

        .nav-item{
          height: 100%;
          display:flex; flex-direction:column; align-items:center; justify-content:center;
          gap:4px;
          color:#cdd3e6;
          font-size:18px;
          text-decoration:none;
          opacity:.9;
          transition: opacity .12s ease, transform .12s ease;
        }
        .nav-item span{ font-size:11px; font-weight:800; letter-spacing:.2px; }
        .nav-item:active{ transform: scale(.96); opacity:1; }

        /* ==========================
           ✅ FAB "Publier" pulse HD
        ========================== */
        .fab{
          justify-self:center;
          width: 78px;
          height: 78px;
          margin-top: -26px;
          border-radius: 20px;
          background:
            radial-gradient(90px 60px at 20% 20%, rgba(109,123,255,.45), transparent 60%),
            radial-gradient(90px 60px at 80% 80%, rgba(34,230,165,.35), transparent 58%),
            linear-gradient(180deg, #0d1730, #0a1022);
          border: 1px solid rgba(78,163,255,0.45);
          box-shadow:
            0 12px 35px rgba(0,0,0,.7),
            0 0 0 1px rgba(78,163,255,.25) inset;
          display:flex; align-items:center; justify-content:center;
          text-decoration:none;
          color:white;
          position: relative;
          animation: fabPulse 2.6s ease-in-out infinite;
          transition: transform .15s ease;
          overflow:hidden;
        }
        .fab:active{ transform: translateY(1px) scale(.97); }

        .fab-inner{
          display:flex; flex-direction:column; align-items:center; gap:2px;
          font-weight:900;
        }
        .fab-plus{
          font-size:28px; line-height:1;
          text-shadow: 0 6px 16px rgba(0,0,0,.6);
        }
        .fab-text{
          font-size:12px; letter-spacing:.3px; opacity:.95;
        }

        /* Pulse discret */
        @keyframes fabPulse{
          0%,100% { transform: translateY(0) scale(1); box-shadow: 0 12px 35px rgba(0,0,0,.7); }
          50%     { transform: translateY(-1px) scale(1.03); box-shadow: 0 18px 45px rgba(78,163,255,.25); }
        }

        /* ✅ Glow quand nouveau deal */
        .fab-glow::after{
          content:"";
          position:absolute; inset:-40%;
          background:
            radial-gradient(120px 80px at 30% 20%, rgba(78,163,255,.9), transparent 60%),
            radial-gradient(120px 80px at 70% 80%, rgba(34,230,165,.8), transparent 58%);
          animation: fabGlow 1.6s ease-out;
          pointer-events:none;
        }
        @keyframes fabGlow{
          0%   { opacity:0; transform: scale(.7); }
          30%  { opacity:1; transform: scale(1); }
          100% { opacity:0; transform: scale(1.2); }
        }
      `}</style>
    </nav>
  );
}
