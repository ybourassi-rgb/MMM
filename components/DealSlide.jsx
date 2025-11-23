"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import DealSlide from "@/components/DealSlide";

export default function Page() {
  const [items, setItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(null);

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

  return (
    <div className="app">
      {/* TOP BAR */}
      <header className="topbar">
        <div className="brand">
          <div className="logo" />
          <span>Money Motor Y</span>
        </div>
        <div className="status">
          IA en ligne<span className="dot" />
        </div>
      </header>

      {/* CHIPS FILTER */}
      <div className="chips">
        {[
          "🔥 Bonnes affaires",
          "🚗 Auto",
          "🏠 Immo",
          "₿ Crypto",
          "🧰 Business",
          "📈 Marchés",
        ].map((t, i) => (
          <button
            key={t}
            className={`chip ${i === 0 ? "active" : ""}`}
            onClick={() => {
              /* filtre bientôt */
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* FEED TikTok */}
      <main ref={feedRef} className="tiktok-feed">
        {items.map((it, i) => (
          <section
            key={it.id || `${it.title}-${i}`}
            data-slide
            data-index={i}
            className="tiktok-slide"
          >
            <DealSlide item={it} active={i === activeIndex} />
          </section>
        ))}

        {!items.length && !loading && (
          <div className="empty">Aucune opportunité pour l’instant.</div>
        )}

        {loading && <div className="tiktok-loading">Chargement...</div>}
      </main>

      {/* BOTTOM NAV */}
      <nav className="bottomnav">
        <div className="navitem active">Feed</div>
        <div className="navitem">Y-Score</div>
        <div className="navitem">Publier</div>
        <div className="navitem">Affiliation</div>
        <div className="navitem">Profil</div>
      </nav>

      {/* Styles */}
      <style jsx global>{`
        :root {
          --bg: #07090f;
          --card: #0f1422;
          --muted: #8b93a7;
          --text: #e9ecf5;
          --accent: #4ea3ff;
          --good: #18d47b;
          --warn: #ffb454;
          --bad: #ff6b6b;
        }
        * {
          box-sizing: border-box;
        }
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
          background: radial-gradient(
              circle at 30% 30%,
              #6d7bff,
              transparent 60%
            ),
            radial-gradient(
              circle at 70% 70%,
              #22e6a5,
              transparent 55%
            ),
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
        .tiktok-feed::-webkit-scrollbar {
          display: none;
        }
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
          background: rgba(0, 0, 0, 0.6);
          font-size: 13px;
        }

        .bottomnav {
          position: sticky;
          bottom: 0;
          border-top: 1px solid #141b33;
          background: #07090f;
          display: flex;
          justify-content: space-around;
          padding: 10px 0;
        }
        .navitem {
          font-size: 12px;
          color: #aeb6cc;
        }
        .navitem.active {
          color: #fff;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
