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

    // ✅ High-Tech + Informatique fusionnés ici
    {
      key: "tech",
      label: "📱 High-Tech",
      match: [
        "tech",
        "high-tech",
        "smartphone",
        "iphone",
        "samsung",
        "xiaomi",
        "android",
        "apple",
        // + mots Informatique
        "pc",
        "ordinateur",
        "laptop",
        "ssd",
        "ryzen",
        "intel",
        "ram",
        "gpu",
        "carte graphique",
      ],
    },

    // ❌ Informatique supprimé
    // { key: "it", label: "💻 Informatique", match: [...] },

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
  }, [filteredItems]);

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
        setItems((prev) => [...prev, ...nextItems]);
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

      {/* ✅ CHIPS FILTER marketplace */}
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
            {c.label}
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

      {/* ✅ BOTTOM NAV cliquable */}
      <BottomNav />

      {/* tes styles restent inchangés */}
    </div>
  );
}
