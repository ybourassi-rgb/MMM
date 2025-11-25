"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function BottomNav() {
  const pathname = usePathname();

  const [pulseFab, setPulseFab] = useState(false);
  const [newGlow, setNewGlow] = useState(false);

  const isActive = (href) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  // ✅ écoute l'event "new deal" envoyé par Home
  useEffect(() => {
    const onNewDeal = () => {
      setNewGlow(true);
      setPulseFab(true);

      // stop pulse rapidement
      const t1 = setTimeout(() => setPulseFab(false), 1400);
      // garde glow un peu plus longtemps
      const t2 = setTimeout(() => setNewGlow(false), 2800);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    };

    window.addEventListener("lbon-souk:new-deal", onNewDeal);
    return () => window.removeEventListener("lbon-souk:new-deal", onNewDeal);
  }, []);

  const Item = ({ href, label, icon }) => {
    const active = isActive(href);
    return (
      <Link href={href} className={`nav-item ${active ? "active" : ""}`}>
        <div className="nav-ico">{icon}</div>
        <div className="nav-label">{label}</div>
        {href === "/" && newGlow && <span className="new-dot" />}
      </Link>
    );
  };

  return (
    <>
      <nav className="bottom-nav">
        <div className="nav-bg" />

        <div className="nav-row">
          <Item href="/" label="Accueil" icon="🏠" />
          <Item href="/search" label="Recherche" icon="🔎" />

          {/* FAB central */}
          <Link
            href="/publier"
            className={`nav-fab ${isActive("/publier") ? "active" : ""} ${
              pulseFab ? "pulse" : ""
            }`}
          >
            <div className="fab-ring" />
            <div className="fab-core">
              <div className="fab-plus">＋</div>
              <div className="fab-text">Publier</div>
            </div>
            {newGlow && <div className="fab-new-glow" />}
          </Link>

          <Item href="/affiliation" label="Gains" icon="💰" />
          <Item href="/profile" label="Profil" icon="👤" />
        </div>
      </nav>

      <style jsx global>{`
        .bottom-nav {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          height: 92px;
          z-index: 50;
          display: flex;
          justify-content: center;
          pointer-events: none;
        }

        .nav-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(1200px 120px at 50% -40px, rgba(78,163,255,0.10), transparent 60%),
            linear-gradient(180deg, rgba(7,9,15,0.0), rgba(7,9,15,0.85) 30%, rgba(7,9,15,0.98));
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .nav-row {
          pointer-events: auto;
          width: min(560px, 100%);
          height: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr 1.2fr 1fr 1fr;
          align-items: center;
          padding: 10px 10px max(10px, env(safe-area-inset-bottom));
          gap: 6px;
          position: relative;
        }

        .nav-item {
          height: 64px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          text-decoration: none;
          color: #aab3c8;
          background: rgba(12,16,28,0.35);
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
          transition: all .18s ease;
          position: relative;
        }
        .nav-item .nav-ico { font-size: 18px; }
        .nav-item .nav-label {
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: .2px;
        }
        .nav-item.active {
          color: white;
          background:
            linear-gradient(180deg, rgba(20,32,58,0.9), rgba(10,16,30,0.9));
          border-color: rgba(78,163,255,0.45);
          box-shadow:
            0 8px 25px rgba(78,163,255,0.18),
            inset 0 1px 0 rgba(255,255,255,0.10);
          transform: translateY(-1px);
        }

        /* petit indicateur "new" sur Accueil */
        .new-dot{
          position:absolute;
          top:8px;
          right:12px;
          width:8px;
          height:8px;
          border-radius:999px;
          background:#22e6a5;
          box-shadow:0 0 12px rgba(34,230,165,0.9);
          animation: pop .4s ease;
        }
        @keyframes pop{
          from{ transform:scale(0); opacity:0;}
          to{ transform:scale(1); opacity:1;}
        }

        /* ===== FAB ===== */
        .nav-fab {
          position: relative;
          height: 78px;
          display: grid;
          place-items: center;
          text-decoration: none;
          transform: translateY(-18px);
          transition: transform .18s ease;
        }

        .fab-ring {
          position: absolute;
          width: 74px;
          height: 74px;
          border-radius: 22px;
          background:
            radial-gradient(60px 60px at 30% 20%, rgba(109,123,255,0.9), transparent 60%),
            radial-gradient(60px 60px at 70% 80%, rgba(34,230,165,0.9), transparent 58%),
            rgba(12,16,28,0.9);
          filter: blur(10px);
          opacity: .8;
        }

        .fab-core {
          width: 70px;
          height: 70px;
          border-radius: 20px;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02)),
            linear-gradient(180deg, #0e1322, #0a0f1c);
          border: 1px solid rgba(78,163,255,0.55);
          display: grid;
          place-items: center;
          box-shadow:
            0 14px 40px rgba(0,0,0,0.7),
            0 0 0 1px rgba(78,163,255,0.25) inset;
          position: relative;
          overflow: hidden;
        }

        .fab-plus {
          font-size: 28px;
          font-weight: 900;
          color: white;
          line-height: 1;
          transform: translateY(2px);
          text-shadow: 0 6px 18px rgba(0,0,0,0.7);
          z-index: 2;
        }

        .fab-text {
          font-size: 11px;
          font-weight: 900;
          color: white;
          opacity: .95;
          margin-top: -2px;
          z-index: 2;
          letter-spacing: .3px;
        }

        .nav-fab.active .fab-core {
          border-color: rgba(34,230,165,0.9);
          box-shadow:
            0 18px 50px rgba(34,230,165,0.25),
            0 0 0 1px rgba(34,230,165,0.35) inset;
        }
        .nav-fab:active { transform: translateY(-16px) scale(0.97); }

        /* ✅ pulse léger */
        .nav-fab.pulse .fab-core{
          animation: fabPulse 1.4s ease-in-out;
        }
        @keyframes fabPulse{
          0%{ transform:scale(1); }
          30%{ transform:scale(1.06); }
          60%{ transform:scale(1); }
          100%{ transform:scale(1); }
        }

        /* ✅ glow nouveau deal derriere FAB */
        .fab-new-glow{
          position:absolute;
          width:86px;
          height:86px;
          border-radius:26px;
          background:
            radial-gradient(50px 50px at 30% 20%, rgba(109,123,255,0.9), transparent 60%),
            radial-gradient(50px 50px at 70% 80%, rgba(34,230,165,0.9), transparent 58%);
          filter: blur(14px);
          opacity:.9;
          animation: glowFade 2.8s ease forwards;
          pointer-events:none;
        }
        @keyframes glowFade{
          0%{ opacity:0; transform:scale(.8); }
          20%{ opacity:1; transform:scale(1); }
          100%{ opacity:0; transform:scale(1.1); }
        }
      `}</style>
    </>
  );
}
