"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export default function BottomNav() {
  const pathname = usePathname();

  const tabs = useMemo(
    () => [
      { href: "/", label: "Feed", icon: "🏠" },
      { href: "/search", label: "Recherche", icon: "🔎" },
      // tu as /publier et /publish. On garde /publier comme dans ta capture.
      { href: "/publier", label: "Publier", icon: "➕" },
      // ta page existe en /affiliation, mais tu veux l'appeler Gains
      { href: "/affiliation", label: "Gains", icon: "💰" },
      { href: "/profile", label: "Profil", icon: "👤" },
    ],
    []
  );

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <nav className="bn-wrap">
      <div className="bn-glass">
        {tabs.map((t) => {
          const active = isActive(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`bn-item ${active ? "active" : ""}`}
              prefetch={false}
            >
              <span className="bn-icon" aria-hidden>
                {t.icon}
              </span>
              <span className="bn-label">{t.label}</span>
              <span className="bn-activeGlow" />
            </Link>
          );
        })}
      </div>

      <style jsx>{`
        .bn-wrap {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 10px;
          z-index: 50;
          display: flex;
          justify-content: center;
          pointer-events: none; /* le glass ne bloque pas le scroll */
        }

        .bn-glass {
          pointer-events: auto;
          width: min(520px, calc(100% - 20px));
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
          padding: 8px;
          border-radius: 18px;

          background:
            radial-gradient(900px 120px at 50% -50px, rgba(78,163,255,0.14), transparent 60%),
            linear-gradient(180deg, rgba(10,14,25,0.92), rgba(7,9,15,0.92));

          border: 1px solid rgba(255,255,255,0.08);
          box-shadow:
            0 18px 60px rgba(0,0,0,0.7),
            inset 0 1px 0 rgba(255,255,255,0.06);

          backdrop-filter: blur(10px);
        }

        .bn-item {
          position: relative;
          height: 54px;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          text-decoration: none; /* ✅ plus de style lien */
          color: #aeb6cc;
          font-weight: 700;
          letter-spacing: 0.2px;
          transition: all 0.18s ease;
          background: transparent;
          border: 1px solid transparent;
          overflow: hidden;
        }

        .bn-icon {
          font-size: 18px;
          line-height: 1;
          filter: drop-shadow(0 6px 12px rgba(0,0,0,0.6));
        }

        .bn-label {
          font-size: 11px;
          opacity: 0.95;
        }

        .bn-item:hover {
          color: #e9ecf5;
          background: rgba(255,255,255,0.03);
        }

        .bn-activeGlow {
          position: absolute;
          inset: -60%;
          background:
            radial-gradient(120px 80px at 20% 30%, rgba(109,123,255,0.45), transparent 60%),
            radial-gradient(120px 80px at 80% 70%, rgba(34,230,165,0.35), transparent 58%);
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }

        .bn-item.active {
          color: #fff;
          background:
            linear-gradient(180deg, rgba(20,32,58,0.9), rgba(10,16,30,0.9));
          border-color: rgba(78,163,255,0.5);
          transform: translateY(-1px);
          box-shadow:
            0 10px 26px rgba(78,163,255,0.18),
            inset 0 1px 0 rgba(255,255,255,0.1);
        }

        .bn-item.active .bn-activeGlow {
          opacity: 1;
        }

        /* safe area iPhone */
        @supports (padding: max(0px)) {
          .bn-wrap { bottom: max(10px, env(safe-area-inset-bottom)); }
        }
      `}</style>
    </nav>
  );
}
