"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: "Feed", icon: "🏠" },
    { href: "/y-score", label: "Y-Score", icon: "📊" },
    // CTA central
    { href: "/publish", label: "Publier", icon: "➕", cta: true },
    { href: "/affiliation", label: "Affiliation", icon: "💰" },
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
            className={`tab ${active ? "active" : ""} ${t.cta ? "cta" : ""}`}
          >
            <div className="icon">{t.icon}</div>
            <div className="label">{t.label}</div>
          </Link>
        );
      })}

      <style jsx>{`
        .nav {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 64px;
          background: #07090f;
          border-top: 1px solid #121a33;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          z-index: 20;
        }
        .tab {
          display: grid;
          place-items: center;
          gap: 2px;
          color: #8b93a7;
          font-size: 11px;
          text-decoration: none;
        }
        .tab .icon { font-size: 18px; }
        .tab.active { color: white; font-weight: 900; }

        .cta {
          transform: translateY(-12px);
        }
        .cta .icon {
          width: 48px; height: 48px;
          border-radius: 14px;
          display: grid; place-items: center;
          background: #112449;
          border: 1px solid #27406f;
          color: white;
          font-size: 24px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        }
        .cta .label { margin-top: -2px; font-weight: 900; color: white; }
      `}</style>
    </nav>
  );
}
