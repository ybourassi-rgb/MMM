"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import DealSlide from "@/components/DealSlide";
import BottomNav from "@/components/BottomNav";

export default function Page() {
  const [items, setItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(null);

  // ✅ filtre chips
  const [selected, setSelected] = useState("all");

  const feedRef = useRef(null);

  // =========================
  // Chips marketplace (priorités)
  // =========================
  const CATEGORIES = [
    { key: "all", label: "🔥 Tous" },
    {
      key: "good",
      label: "💥 Bonnes affaires",
      match: ["deal", "promo", "réduction", "soldes", "bon plan"],
    },

    // ✅ High-Tech + Informatique fusionnés
    {
      key: "tech",
      label: "📱 High-Tech",
      match: [
        "tech", "high-tech", "smartphone", "iphone", "samsung", "xiaomi",
        "android", "apple",
        "pc", "ordinateur", "laptop", "ssd", "ryzen", "intel", "ram", "gpu",
        "carte graphique",
      ],
    },

    { key: "gaming", label: "🎮 Gaming", match: ["ps5", "xbox", "switch", "gaming", "steam", "console", "jeu"] },

    { key: "home", label: "🏠 Maison", match: ["maison", "jardin", "meuble", "canapé", "lit", "déco", "electroménager", "aspirateur"] },
    { key: "diy", label: "🛠️ Bricolage", match: ["bricolage", "outils", "perceuse", "bosch", "makita", "jardinage"] },

    { key: "auto", label: "🚗 Auto/Moto", match: ["auto", "voiture", "moto", "pneu", "carburant", "garage"] },

    { key: "fashion", label: "👕 Mode/Beauté", match: ["mode", "vetement", "chaussure", "nike", "adidas", "parfum", "beaute", "cosmétique"] },

    { key: "baby", label: "🍼 Bébé/Enfant", match: ["bébé", "enfant", "poussette", "jouet", "couches"] },

    { key: "travel", label: "✈️ Voyage", match: ["voyage", "travel", "vol", "flight", "hotel", "airbnb", "booking", "séjour"] },

    { key: "leisure", label: "🎟️ Loisirs", match: ["cinema", "concert", "sport", "sortie", "loisir", "parc"] },

    { key: "free", label: "🎁 Gratuit", match: ["gratuit", "freebie", "offert", "échantillon"] },
  ];

  // =========================
  // 1) Load initial feed
  // =========================
  useEffect(() => {
    fetch("/api/feed", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const firstItems = d.items || d || [];
        setItems(firstItems);
        if (d.cursor) setCursor(d.cursor);

        // ✅ Glow FAB si on reçoit des deals au chargement
        if (firstItems.length && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("lbon-souk:new-deal"));
        }
      })
      .catch(() => setItems([]));
  }, []);

  // =========================
  // ✅ Filtre local instantané
  // =========================
  const filteredItems = useMemo(() => {
    if (selected === "all") return items;

    const cat = CATEGORIES.find((c) => c.key === selected);
    const words = cat?.match || [];
    if (!words.length) return items;

    return items.filter((it) => {
      const text = `${it.category || ""} ${it.title || ""} ${it.summary || ""}`.toLowerCase();
      return words.some((w) => text.includes(w.toLowerCase()));
    });
  }, [items, selected]);

  // =========================
  // 2) Detect active slide
  // =========================
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
  }, [filteredItems]); // ✅ suit la liste filtrée

  // =========================
  // 3) Fetch more when near end
  // =========================
  const fetchMore = useCallback(async () => {
    if (loading) return;
    if (activeIndex < filteredItems.length - 3) return;

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
        setItems((prev) => {
          const merged = [...prev, ...nextItems];

          // ✅ Glow FAB quand des nouveaux deals arrivent
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("lbon-souk:new-deal"));
          }

          return merged;
        });

        if (nextCursor) setCursor(nextCursor);
      }
    } catch (e) {
      console.error("fetchMore error", e);
    } finally {
      setLoading(false);
    }
  }, [activeIndex, filteredItems.length, loading, cursor]);

  useEffect(() => {
    fetchMore();
  }, [fetchMore]);

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

      {/* ✅ CHIPS FILTER marketplace (haute dimension) */}
      <div className="chips">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`chip ${selected === c.key ? "active" : ""}`}
            onClick={() => {
              setSelected(c.key);
              feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
              setActiveIndex(0);
            }}
          >
            <span className="chipLabel">{c.label}</span>
            <span className="chipGlow" />
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
          <div className="empty">Aucune opportunité pour cette catégorie.</div>
        )}

        {loading && <div className="tiktok-loading">Chargement...</div>}
      </main>

      <BottomNav />

      {/* ✅ Styles globaux + chips HD */}
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
          background:
            radial-gradient(circle at 30% 30%, #6d7bff, transparent 60%),
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

        /* =========================
           ✅ CHIPS “HAUTE DIMENSION”
        ========================= */
        .chips {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding: 8px 12px 10px;
          scrollbar-width: none;
          background:
            radial-gradient(1200px 80px at 50% -40px, rgba(78,163,255,0.08), transparent 60%),
            #07090f;
          position: sticky;
          top: 54px;
          z-index: 9;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          backdrop-filter: blur(6px);
        }
        .chips::-webkit-scrollbar { display: none; }

        .chip {
          position: relative;
          flex: 0 0 auto;
          padding: 9px 13px;
          border-radius: 999px;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)),
            rgba(14,19,34,0.9);
          border: 1px solid rgba(78,163,255,0.18);
          color: #cfd5e8;
          font-size: 13px;
          white-space: nowrap;
          cursor: pointer;
          transition: all .18s ease;
          box-shadow:
            0 6px 18px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.08);
          overflow: hidden;
        }
        .chip:hover {
          transform: translateY(-1px);
          border-color: rgba(78,163,255,0.35);
        }

        .chipLabel {
          position: relative;
          z-index: 2;
          font-weight: 700;
          letter-spacing: .2px;
        }

        .chipGlow {
          position: absolute;
          inset: -40%;
          background:
            radial-gradient(120px 60px at 20% 30%, rgba(109,123,255,0.35), transparent 60%),
            radial-gradient(120px 60px at 80% 70%, rgba(34,230,165,0.28), transparent 58%);
          opacity: 0;
          transition: opacity .2s ease;
          z-index: 1;
          pointer-events: none;
        }

        .chip.active {
          color: #fff;
          font-weight: 900;
          border-color: rgba(78,163,255,0.65);
          background:
            linear-gradient(180deg, rgba(20,32,58,0.95), rgba(10,16,30,0.95));
          box-shadow:
            0 10px 30px rgba(78,163,255,0.22),
            0 0 0 1px rgba(78,163,255,0.35) inset,
            inset 0 1px 0 rgba(255,255,255,0.12);
          transform: translateY(-1px) scale(1.02);
        }
        .chip.active .chipGlow { opacity: 1; }

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
          background: rgba(0, 0, 0, 0.6);
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
