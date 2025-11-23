"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import DealSlide from "./DealSlide";

export default function TikTokFeed({ initialItems = [], fetchMore }) {
  const containerRef = useRef(null);
  const [items, setItems] = useState(initialItems);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Observer pour savoir quel slide est actif
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const slides = Array.from(root.querySelectorAll("[data-slide]"));
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const idx = Number(visible.target.getAttribute("data-index"));
        if (!Number.isNaN(idx)) setActiveIndex(idx);
      },
      { root, threshold: [0.6, 0.8, 1] }
    );

    slides.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [items]);

  // Fetch batch suivant quand on approche de la fin
  const maybeFetchMore = useCallback(async () => {
    if (loading) return;
    if (activeIndex < items.length - 3) return;

    setLoading(true);
    try {
      const next = await fetchMore();
      if (next?.length) setItems((prev) => [...prev, ...next]);
    } finally {
      setLoading(false);
    }
  }, [activeIndex, items.length, loading, fetchMore]);

  useEffect(() => {
    maybeFetchMore();
  }, [maybeFetchMore]);

  return (
    <div
      ref={containerRef}
      className="tiktok-feed"
      aria-label="Feed TikTok"
    >
      {items.map((item, i) => (
        <section
          key={item.id || i}
          data-slide
          data-index={i}
          className="tiktok-slide"
        >
          <DealSlide item={item} active={i === activeIndex} />
        </section>
      ))}

      {loading && (
        <div className="tiktok-loading">
          Chargement...
        </div>
      )}
    </div>
  );
}
