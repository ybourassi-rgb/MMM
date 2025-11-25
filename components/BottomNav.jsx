"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const tabs = [
    { href: "/", label: "Feed", icon: "🏠" },
    { href: "/yscore", label: "Y-Score", icon: "📊" },
    // CTA Publish au centre
    { href: "/publier", label: "Publier", icon: "＋", cta: true },
    { href: "/affiliation", label: "Gains", icon: "💰" },
    { href: "/profile", label: "Profil", icon: "👤" },
  ];

  return (
    <nav className="nav">
      {tabs.map((t) => {
        const active = isActive(t.href);

        return (
          <Link
            key={t.href}
            href={t.href}
            className={`item ${active ? "active" : ""} ${t.cta ? "cta" : ""}`}
          >
            <span className="icon">{t.icon}</span>
            <span className="label">{t.label}</span>
          </Link>
        );
      })}

      <style jsx>{`
        .nav {
          position: fixed;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          width: min(680px, calc(100% - 24px));
          height: 68px;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          align-items: center;
          padding: 0 10px;
          border-radius: 22px;
          background: rgba(12, 16, 28, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 10px 40px rgba(0,0,0,0.55),
            inset 0 1px 0 rgba(255,255,255,0.03);
          backdrop-filter: blur(12px);
          z-index: 50;
        }

        .item {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 4px;
          color: rgba(233,236,245,0.7);
          text-decoration: none;
          font-weight: 700;
          font-size: 11.5px;
          transition: 0.2s ease;
          position: relative;
        }

        .icon {
          font-size: 20px;
          line-height: 1;
          transform: translateY(1px);
          transition: 0.2s ease;
        }

        .label {
          letter-spacing: 0.2px;
        }

        .item.active {
          color: #ffffff;
        }
        .item.active .icon {
          transform: translateY(-1px) scale(1.08);
          filter: drop-shadow(0 6px 14px rgba(78,163,255,0.8));
        }
        .item.active::after {
          content: "";
          position: absolute;
          bottom: 6px;
          width: 26px;
          height: 3px;
          border-radius: 999px;
          background: linear-gradient(90deg, #4ea3ff, #22e6a5);
          box-shadow: 0 0 14px rgba(78,163,255,0.9);
        }

        /* CTA central */
        .item.cta {
          transform: translateY(-16px);
          color: #0b1020;
          font-weight: 900;
        }
        .item.cta .icon {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          font-size: 26px;
          background: radial-gradient(
              circle at 30% 20%,
              #6d7bff,
              transparent 60%
            ),
            radial-gradient(
              circle at 70% 80%,
              #22e6a5,
              transparent 55%
            ),
            #4ea3ff;
          box-shadow:
            0 12px 30px rgba(78,163,255,0.6),
            0 2px 0 rgba(255,255,255,0.35) inset;
          color: white;
        }
        .item.cta .label {
          font-size: 10.5px;
          color: rgba(233,236,245,0.9);
          margin-top: 2px;
        }
        .item.cta.active .icon {
          filter: drop-shadow(0 10px 18px rgba(34,230,165,0.9));
        }
      `}</style>
    </nav>
  );
}
