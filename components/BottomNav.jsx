"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const NAV = [
    { href: "/", label: "Feed", icon: "🏠" },
    // Y-Score désactivé tant que route pas créée
    // { href: "/yscore", label: "Y-Score", icon: "📊" },

    { href: "/publier", label: "Publier", icon: "➕" },
    { href: "/affiliation", label: "Gains", icon: "💰" },
    { href: "/profile", label: "Profil", icon: "👤" },
  ];

  return (
    <nav className="bottom-nav">
      {NAV.map((n) => {
        const active =
          n.href === "/"
            ? pathname === "/"
            : pathname.startsWith(n.href);

        return (
          <Link
            key={n.href}
            href={n.href}
            className={`nav-item ${active ? "active" : ""}`}
          >
            <div className="nav-icon">{n.icon}</div>
            <div className="nav-label">{n.label}</div>
            <div className="nav-glow" />
          </Link>
        );
      })}

      <style jsx>{`
        .bottom-nav {
          position: fixed;
          left: 10px;
          right: 10px;
          bottom: 10px;
          height: 64px;
          display: grid;
          grid-template-columns: repeat(${NAV.length}, 1fr);
          background:
            linear-gradient(180deg, rgba(15,20,34,0.98), rgba(8,10,18,0.98));
          border: 1px solid rgba(78,163,255,0.18);
          border-radius: 18px;
          backdrop-filter: blur(10px);
          box-shadow:
            0 12px 40px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(255,255,255,0.06);
          z-index: 50;
          overflow: hidden;
        }

        .nav-item {
          position: relative;
          display: grid;
          place-items: center;
          gap: 4px;
          color: #8f98b3;
          text-decoration: none;
          font-weight: 700;
          font-size: 12px;
          transition: all 0.18s ease;
        }

        .nav-icon {
          font-size: 20px;
          transform: translateY(1px);
          transition: transform .18s ease;
        }

        .nav-label {
          font-size: 11px;
          letter-spacing: .2px;
          transition: color .18s ease;
        }

        .nav-glow {
          position: absolute;
          inset: -60%;
          background:
            radial-gradient(120px 60px at 50% 10%, rgba(78,163,255,0.25), transparent 60%),
            radial-gradient(120px 60px at 50% 90%, rgba(34,230,165,0.18), transparent 65%);
          opacity: 0;
          transition: opacity .18s ease;
          pointer-events: none;
        }

        .nav-item.active {
          color: white;
          text-shadow: 0 6px 22px rgba(78,163,255,0.55);
        }
        .nav-item.active .nav-icon {
          transform: translateY(-2px) scale(1.08);
        }
        .nav-item.active .nav-glow {
          opacity: 1;
        }
      `}</style>
    </nav>
  );
}
