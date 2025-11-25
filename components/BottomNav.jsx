"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Feed", icon: "🏠" },
  { href: "/yscore", label: "Y-Score", icon: "📊" },
  { href: "/publier", label: "Publier", icon: "＋", big: true },
  { href: "/affiliation", label: "Gains", icon: "💰" },
  { href: "/profile", label: "Profil", icon: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <nav className="dock">
      {NAV.map((item) => {
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`dockItem ${active ? "active" : ""} ${
              item.big ? "big" : ""
            }`}
            aria-current={active ? "page" : undefined}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
            {active && <span className="activeGlow" />}
          </Link>
        );
      })}

      <style jsx>{`
        .dock {
          position: fixed;
          left: 50%;
          bottom: 16px;
          transform: translateX(-50%);
          z-index: 50;

          display: grid;
          grid-auto-flow: column;
          gap: 6px;
          padding: 8px;

          background: rgba(10, 14, 26, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;

          backdrop-filter: blur(10px);
          box-shadow:
            0 12px 40px rgba(0, 0, 0, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .dockItem {
          position: relative;
          min-width: 64px;
          padding: 8px 10px;
          border-radius: 12px;

          display: grid;
          place-items: center;
          gap: 3px;

          color: rgba(220, 226, 241, 0.85);
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;

          transition: transform .15s ease, background .2s ease, color .2s ease;
        }

        .dockItem:hover {
          transform: translateY(-2px);
          background: rgba(255,255,255,0.04);
          color: white;
        }

        .icon {
          font-size: 18px;
          line-height: 1;
        }

        .label {
          letter-spacing: 0.2px;
          white-space: nowrap;
        }

        /* Active tab */
        .dockItem.active {
          background: rgba(78,163,255,0.10);
          color: #fff;
          box-shadow:
            0 6px 16px rgba(78,163,255,0.25),
            inset 0 0 0 1px rgba(78,163,255,0.35);
          transform: translateY(-1px);
        }

        .activeGlow {
          position: absolute;
          inset: -40%;
          border-radius: 999px;
          background:
            radial-gradient(120px 70px at 20% 30%, rgba(109,123,255,0.35), transparent 60%),
            radial-gradient(140px 80px at 80% 70%, rgba(34,230,165,0.30), transparent 62%);
          filter: blur(18px);
          opacity: 0.8;
          pointer-events: none;
          z-index: -1;
        }

        /* Middle “Publier” button */
        .dockItem.big {
          min-width: 72px;
          padding: 10px 12px;
          background:
            linear-gradient(180deg, rgba(78,163,255,0.18), rgba(34,230,165,0.10)),
            rgba(20, 32, 58, 0.9);
          border: 1px solid rgba(78,163,255,0.35);
          transform: translateY(-6px);
          box-shadow:
            0 10px 30px rgba(78,163,255,0.30),
            inset 0 1px 0 rgba(255,255,255,0.12);
        }

        .dockItem.big .icon {
          font-size: 20px;
          font-weight: 900;
        }
      `}</style>
    </nav>
  );
}
