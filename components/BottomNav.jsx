"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const nav = [
    { label: "Feed", href: "/" },
    { label: "Y-Score", href: "/yscore" },
    { label: "Publier", href: "/publish" },
    { label: "Affiliation", href: "/affiliation" },
    { label: "Profil", href: "/profil" },
  ];

  return (
    <nav className="bottomnav">
      {nav.map((n) => {
        const active = pathname === n.href;
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`navitem ${active ? "active" : ""}`}
          >
            {n.label}
          </Link>
        );
      })}

      <style jsx>{`
        .bottomnav {
          position: sticky;
          bottom: 0;
          border-top: 1px solid #141b33;
          background: #07090f;
          display: flex;
          justify-content: space-around;
          padding: 10px 0;
          z-index: 10;
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
          background: #11162a;
          border: 1px solid #1a2340;
        }
      `}</style>
    </nav>
  );
}
