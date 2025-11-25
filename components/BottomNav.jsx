"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: "Feed", icon: "🏠" },
    { href: "/search", label: "Recherche", icon: "🔎" },
    { href: "/publish", label: "Publier", icon: "＋", big: true }, // bouton central
    { href: "/affiliation", label: "Gains", icon: "💰" },
    { href: "/profile", label: "Profil", icon: "👤" },
  ];

  return (
    <nav className="nav">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`tab ${active ? "active" : ""} ${t.big ? "big" : ""}`}
          >
            <div className="icon">{t.icon}</div>
            {!t.big && <div className="label">{t.label}</div>}
            {t.big && <div className="labelBig">{t.label}</div>}
            <div className="glow" />
          </Link>
        );
      })}

      <style jsx>{`
        .nav {
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          bottom: 12px;
          width: min(680px, calc(100% - 18px));
          height: 66px;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          align-items: center;
          padding: 8px 10px;
          border-radius: 18px;
          background:
            radial-gradient(800px 120px at 50% -60px, rgba(78,163,255,0.12), transparent 60%),
            rgba(8, 10, 16, 0.9);
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow:
            0 16px 40px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(255,255,255,0.06);
          backdrop-filter: blur(10px);
          z-index: 999;
        }

        .tab {
          position: relative;
          height: 100%;
          display: grid;
          place-items: center;
          text-decoration: none;
          color: #c6cce0;
          border-radius: 14px;
          transition: all .16s ease;
          overflow: hidden;
        }

        .icon {
          font-size: 20px;
          line-height: 1;
          transform: translateZ(0);
        }

        .label {
          font-size: 11px;
          font-weight: 700;
          margin-top: 2px;
          opacity: .95;
        }

        .glow {
          position: absolute;
          inset: -50%;
          background:
            radial-gradient(120px 60px at 30% 20%, rgba(109,123,255,0.35), transparent 60%),
            radial-gradient(120px 60px at 70% 80%, rgba(34,230,165,0.28), transparent 58%);
          opacity: 0;
          transition: opacity .2s ease;
          pointer-events: none;
        }

        .tab.active {
          color: #fff;
          background: rgba(20,32,58,0.7);
          border: 1px solid rgba(78,163,255,0.5);
          box-shadow:
            0 8px 20px rgba(78,163,255,0.20),
            inset 0 1px 0 rgba(255,255,255,0.08);
          transform: translateY(-1px);
        }
        .tab.active .glow { opacity: 1; }

        /* ===== bouton central Publier ===== */
        .tab.big {
          height: 58px;
          margin-top: -24px;
          background:
            linear-gradient(180deg, rgba(20,36,80,0.95), rgba(9,15,32,0.95));
          border: 1px solid rgba(78,163,255,0.7);
          box-shadow:
            0 12px 30px rgba(78,163,255,0.28),
            0 0 0 1px rgba(78,163,255,0.35) inset;
        }
        .tab.big .icon {
          font-size: 24px;
          font-weight: 900;
        }
        .labelBig {
          font-size: 10px;
          font-weight: 900;
          margin-top: 1px;
          letter-spacing: .3px;
          color: #e9ecf5;
        }
        .tab.big.active {
          transform: translateY(-26px) scale(1.04);
        }
      `}</style>
    </nav>
  );
}
