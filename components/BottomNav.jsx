"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const items = useMemo(
    () => [
      { key: "home", label: "Accueil", href: "/", icon: "🏠" },
      { key: "search", label: "Recherche", href: "/search", icon: "🔎" },

      // bouton central "Publier" (CTA)
      { key: "publish", label: "Publier", href: "/publish", icon: "➕", center: true },

      { key: "affiliation", label: "Affiliation", href: "/affiliation", icon: "💰" },
      { key: "profile", label: "Profil", href: "/profile", icon: "👤" },
    ],
    []
  );

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <nav className="bn-wrap" role="navigation" aria-label="Bottom Navigation">
      <div className="bn-blur" />

      <div className="bn-bar">
        {items.map((it) => {
          const active = isActive(it.href);

          if (it.center) {
            return (
              <button
                key={it.key}
                className={`bn-center ${active ? "active" : ""}`}
                onClick={() => router.push(it.href)}
                aria-label={it.label}
              >
                <div className="bn-center-ring" />
                <div className="bn-center-icon">{it.icon}</div>
                <div className="bn-center-label">{it.label}</div>
              </button>
            );
          }

          return (
            <Link
              key={it.key}
              href={it.href}
              className={`bn-item ${active ? "active" : ""}`}
              aria-label={it.label}
            >
              <div className="bn-icon">{it.icon}</div>
              <div className="bn-label">{it.label}</div>
              <div className="bn-active-glow" />
            </Link>
          );
        })}
      </div>

      <style jsx>{`
        .bn-wrap {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 50;
          padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
          pointer-events: none;
        }

        .bn-blur {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 110px;
          background: radial-gradient(
              900px 140px at 50% 100%,
              rgba(78, 163, 255, 0.12),
              transparent 60%
            ),
            linear-gradient(180deg, transparent, rgba(7, 9, 15, 0.9) 45%, rgba(7, 9, 15, 1));
          pointer-events: none;
        }

        .bn-bar {
          pointer-events: auto;
          position: relative;
          height: 64px;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          align-items: center;
          border-radius: 18px;
          background: rgba(12, 16, 28, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow:
            0 12px 40px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(10px);
          overflow: visible;
        }

        .bn-item {
          position: relative;
          height: 100%;
          display: grid;
          place-items: center;
          gap: 2px;
          color: #c6cce0;
          text-decoration: none;
          font-weight: 700;
          transition: 0.18s ease;
        }

        .bn-icon {
          font-size: 20px;
          transform: translateY(1px);
        }

        .bn-label {
          font-size: 11px;
          opacity: 0.9;
          letter-spacing: 0.2px;
        }

        .bn-item:hover {
          color: #fff;
          transform: translateY(-1px);
        }

        .bn-item.active {
          color: #fff;
        }

        .bn-active-glow {
          position: absolute;
          inset: -8px 10px -6px 10px;
          border-radius: 14px;
          background:
            radial-gradient(120px 60px at 50% 80%, rgba(78,163,255,0.35), transparent 60%),
            radial-gradient(90px 50px at 50% 120%, rgba(34,230,165,0.25), transparent 60%);
          opacity: 0;
          transition: opacity .2s ease;
          pointer-events: none;
        }

        .bn-item.active .bn-active-glow {
          opacity: 1;
        }

        /* ===== bouton central Publier ===== */
        .bn-center {
          position: relative;
          height: 74px;
          width: 74px;
          margin: 0 auto;
          transform: translateY(-16px);
          border-radius: 22px;
          border: none;
          background:
            linear-gradient(160deg, rgba(78,163,255,0.95), rgba(34,230,165,0.9));
          box-shadow:
            0 12px 40px rgba(78,163,255,0.35),
            0 10px 30px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(255,255,255,0.35);
          display: grid;
          place-items: center;
          gap: 2px;
          color: #0b1020;
          font-weight: 900;
          cursor: pointer;
          transition: transform .15s ease, filter .2s ease;
          overflow: hidden;
        }

        .bn-center:hover {
          transform: translateY(-18px) scale(1.02);
          filter: saturate(1.1);
        }
        .bn-center:active {
          transform: translateY(-14px) scale(0.98);
        }

        .bn-center-ring {
          position: absolute;
          inset: -40%;
          background:
            radial-gradient(120px 70px at 25% 30%, rgba(255,255,255,0.7), transparent 60%),
            radial-gradient(150px 90px at 70% 70%, rgba(255,255,255,0.35), transparent 60%);
          opacity: 0.7;
          pointer-events: none;
          mix-blend-mode: overlay;
        }

        .bn-center-icon {
          font-size: 24px;
          line-height: 1;
        }

        .bn-center-label {
          font-size: 11px;
          letter-spacing: 0.2px;
          transform: translateY(-2px);
        }

        .bn-center.active {
          box-shadow:
            0 12px 50px rgba(78,163,255,0.55),
            0 0 0 2px rgba(255,255,255,0.35) inset;
        }

        @media (max-width: 380px) {
          .bn-bar { height: 60px; }
          .bn-center { height: 70px; width: 70px; }
        }
      `}</style>
    </nav>
  );
}
