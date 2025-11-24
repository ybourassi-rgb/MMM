"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname() || "/";

  const isActive = (href) => pathname === href;

  return (
    <nav className="bottomnav">
      <Link href="/" className={`navitem ${isActive("/") ? "active" : ""}`}>
        Feed
      </Link>
      <Link href="/yscore" className={`navitem ${isActive("/yscore") ? "active" : ""}`}>
        Y-Score
      </Link>
      <Link href="/publish" className={`navitem ${isActive("/publish") ? "active" : ""}`}>
        Publier
      </Link>
      <Link
        href="/affiliation"
        className={`navitem ${isActive("/affiliation") ? "active" : ""}`}
      >
        Affiliation
      </Link>
      <Link href="/profile" className={`navitem ${isActive("/profile") ? "active" : ""}`}>
        Profil
      </Link>

      <style jsx>{`
        .bottomnav {
          position: fixed;          /* ✅ au-dessus du feed */
          left: 0;
          right: 0;
          bottom: 0;
          height: 64px;
          border-top: 1px solid #141b33;
          background: rgba(7, 9, 15, 0.95);
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: space-around;
          align-items: center;
          z-index: 9999;            /* ✅ très haut */
          pointer-events: auto;     /* ✅ clics autorisés */
        }

        .navitem {
          font-size: 12px;
          color: #aeb6cc;
          text-decoration: none;
          padding: 6px 10px;
          border-radius: 10px;
        }

        .navitem.active {
          color: #fff;
          font-weight: 800;
          background: rgba(78, 163, 255, 0.12);
          border: 1px solid rgba(78, 163, 255, 0.35);
        }
      `}</style>
    </nav>
  );
}
