"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import DealSlide from "@/components/DealSlide";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";

export default function Page() {
  const [items, setItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(null);

  // ✅ filtre local simple
  const [filter, setFilter] = useState("all"); 
  // all | community | travel | auto | immo | tech | home | family | lifestyle

  const feedRef = useRef(null);

  // 1) Load initial feed
  useEffect(() => {
    fetch("/api/feed", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const firstItems = d.items || d || [];
        setItems(firstItems);
        if (d.cursor) setCursor(d.cursor);
      })
      .catch(() => setItems([]));
  }, []);

  // 2) Detect active slide
  useEffect(() => {
    if (!feedRef.current) return;

    const slides = [...feedRef.current.querySelectorAll("[data-slide]")];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;

        const idx = Number(visible.target.getAttribute("data-index"));
        if (!Number.isNaN(idx)) setActiveIndex(idx);
      },
      { root: feedRef.current, threshold: [0.6, 0.8, 1] }
    );

    slides.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [items]);

  // 3) Fetch more when near end
  const fetchMore = useCallback(async () => {
    if (loading) return;
    if (activeIndex < items.length - 3) return;

    setLoading(true);
    try {
      const url = cursor
        ? `/api/feed?cursor=${cursor}`
        : `/api/feed?cursor=next`;

      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      const nextItems = Array.isArray(data) ? data : data.items;
      const nextCursor = Array.isArray(data) ? null : data.cursor;

      if (nextItems?.length) {
        setItems((prev) => [...prev, ...nextItems]);
        if (nextCursor) setCursor(nextCursor);
      }
    } catch (e) {
      console.error("fetchMore error", e);
    } finally {
      setLoading(false);
    }
  }, [activeIndex, items.length, loading, cursor]);

  useEffect(() => {
    fetchMore();
  }, [fetchMore]);

  // ✅ items filtrés (front only)
  const filteredItems = useMemo(() => {
    if (filter === "all") return items;

    if (filter === "community")
      return items.filter((it) =>
        String(it.source || "").toLowerCase().includes("community")
      );

    // sinon on filtre par catégorie/bucket
    return items.filter((it) => {
      const c = String(it.category || "").toLowerCase();
      const s = String(it.source || "").toLowerCase();
      const t = String(it.title || "").toLowerCase();

      if (filter === "travel")
        return s.includes("travel") || c.includes("voyage") || t.includes("vol ") || t.includes("hotel");
      if (filter === "auto")
        return c.includes("auto") || t.includes("voiture") || t.includes("moto");
      if (filter === "immo")
        return c.includes("immo") || c.includes("immobilier") || t.includes("appartement");
      if (filter === "tech")
        return c.includes("tech") || t.includes("pc") || t.includes("ps5");
      if (filter === "home")
        return c.includes("maison") || c.includes("jardin") || t.includes("meuble") || t.includes("bricolage");
      if (filter === "family")
        return c.includes("bébé") || c.includes("enfant") || t.includes("jouet");
      if (filter === "lifestyle")
        return c.includes("mode") || c.includes("sport") || c.includes("beauté");

      return true;
    });
  }, [items, filter]);

  return (
    <div className="app">
      {/* TOP BAR */}
      <header className="topbar">
        <div className="brand">
          <div className="logo" />
          <span>Le Bon Souk</span>
        </div>
        <div className="status">
          IA en ligne<span className="dot" />
        </div>
      </header>

      {/* CHIPS FILTER */}
      <div className="chips">
        {[
          { key: "all", label: "🔥 Tout" },
          { key: "community", label: "🧑‍🤝‍🧑 Communauté" },
          { key: "travel", label: "🌍 Voyage" },
          { key: "auto", label: "🚗 Auto" },
          { key: "immo", label: "🏠 Immo" },
          { key: "tech", label: "🕹️ Tech" },
          { key: "home", label: "🛠️ Maison" },
          { key: "family", label: "👶 Famille" },
          { key: "lifestyle", label: "👟 Mode/Sport" },
        ].map((f) => (
          <button
            key={f.key}
            className={`chip ${filter === f.key ? "active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* FEED TikTok */}
      <main ref={feedRef} className="tiktok-feed">
        {filteredItems.map((it, i) => (
          <section
            key={it.id || `${it.title}-${i}`}
            data-slide
            data-index={i}
            className="tiktok-slide"
          >
            <DealSlide item={it} active={i === activeIndex} />
          </section>
        ))}

        {!filteredItems.length && !loading && (
          <div className="empty">Aucune opportunité pour l’instant.</div>
        )}

        {loading && <div className="tiktok-loading">Chargement...</div>}
      </main>

      {/* ✅ bouton Publier flottant */}
      <Link href="/publish" className="fab">
        ＋ Publier un deal
      </Link>

      <BottomNav />

      <style jsx global>{`
        :root {
          --bg: #07090f;
          --card: #0f1422;
          --muted: #8b93a7;
          --text: #e9ecf5;
          --accent: #4ea3ff;
          --good: #18d47b;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: var(--bg);
          color: var(--text);
          font-family: system-ui;
        }
        .app {
          height: 100svh;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .topbar {
          position: sticky;
          top: 0;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px;
          background: linear-gradient(
            180deg,
            rgba(7, 9, 15, 0.98),
            rgba(7, 9, 15, 0.6),
            transparent
          );
          backdrop-filter: blur(8px);
        }
        .brand {
          display: flex;
          gap: 10px;
          align-items: center;
          font-weight: 800;
        }
        .logo {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: radial-gradient(circle at 30% 30%, #6d7bff, transparent 60%),
                      radial-gradient(circle at 70% 70%, #22e6a5, transparent 55%),
                      #0b1020;
        }
        .status {
          font-size: 12px;
          background: #0e1322;
          border: 1px solid #1a2340;
          padding: 6px 10px;
          border-radius: 999px;
        }
        .dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: var(--good);
          border-radius: 50%;
          margin-left: 6px;
        }

        .chips {
          display: flex;
          gap: 8px;
          overflow: auto;
          padding: 6px 10px 8px;
          scrollbar-width: none;
        }
        .chip {
          flex: 0 0 auto;
          padding: 8px 12px;
          border-radius: 999px;
          background: #0e1322;
          border: 1px solid #1a2340;
          color: #c6cce0;
          font-size: 13px;
        }
        .chip.active {
          background: #14203a;
          border-color: #27406f;
          color: #fff;
          font-weight: 800;
        }

        .tiktok-feed {
          flex: 1;
          height: 100%;
          overflow-y: auto;
          scroll-snap-type: y mandatory;
          scroll-behavior: smooth;
          scrollbar-width: none;
          background: #05060a;
        }
        .tiktok-feed::-webkit-scrollbar { display: none; }
        .tiktok-slide {
          height: 100vh;
          scroll-snap-align: start;
          scroll-snap-stop: always;
          position: relative;
        }

        .empty {
          height: 100%;
          display: grid;
          place-items: center;
          color: var(--muted);
        }
        .tiktok-loading {
          position: sticky;
          bottom: 0;
          text-align: center;
          padding: 10px 0;
          background: rgba(0,0,0,0.6);
          font-size: 13px;
        }

        /* ✅ Floating Publish Button */
        .fab{
          position: fixed;
          right: 14px;
          bottom: 84px; /* au-dessus de la bottomnav */
          z-index: 9999;
          background: rgba(78,163,255,0.95);
          color: white;
          padding: 12px 14px;
          border-radius: 999px;
          font-weight: 900;
          text-decoration: none;
          box-shadow: 0 10px 30px rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.25);
          backdrop-filter: blur(6px);
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
