"use client";

import { useEffect, useState, useRef } from "react";
import DealCard from "./components/DealCard";

export default function HomeFeed() {
  const [items, setItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const feedRef = useRef(null);

  useEffect(() => {
    fetch("/api/feed", { cache: "no-store" })
      .then(r => r.json())
      .then(d => setItems(d.items || []))
      .catch(() => setItems([]));
  }, []);

  // détecter la carte active
  useEffect(() => {
    if (!feedRef.current) return;
    const cards = [...feedRef.current.querySelectorAll("[data-card]")];

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const idx = Number(e.target.getAttribute("data-index"));
            setActiveIndex(idx);
          }
        });
      },
      { threshold: 0.6 }
    );

    cards.forEach(c => io.observe(c));
    return () => io.disconnect();
  }, [items]);

  return (
    <div className="app">
      {/* TOP BAR */}
      <header className="topbar">
        <div className="brand">
          <div className="logo" />
          <span>Money Motor Y</span>
        </div>
        <div className="status">IA en ligne<span className="dot" /></div>
      </header>

      {/* CHIPS FILTER */}
      <div className="chips">
        {["🔥 Bonnes affaires","🚗 Auto","🏠 Immo","₿ Crypto","🧰 Business","📈 Marchés"].map((t,i)=>(
          <button
            key={t}
            className={`chip ${i===0 ? "active" : ""}`}
            onClick={()=>{/* bientôt filtre */}}
          >
            {t}
          </button>
        ))}
      </div>

      {/* FEED */}
      <main ref={feedRef} className="feed">
        {items.map((it, i) => (
          <section
            key={it.id}
            data-card
            data-index={i}
            className="snap-card"
          >
            <DealCard item={it} active={i===activeIndex} />
          </section>
        ))}

        {!items.length && (
          <div className="empty">
            Aucune opportunité pour l’instant.
          </div>
        )}
      </main>

      {/* BOTTOM NAV */}
      <nav className="bottomnav">
        <div className="navitem active">Feed</div>
        <div className="navitem">Y-Score</div>
        <div className="navitem">Publier</div>
        <div className="navitem">Affiliation</div>
        <div className="navitem">Profil</div>
      </nav>

      {/* styles scoped */}
      <style jsx global>{`
        :root{
          --bg:#07090f; --card:#0f1422; --muted:#8b93a7; --text:#e9ecf5;
          --accent:#4ea3ff; --good:#18d47b; --warn:#ffb454; --bad:#ff6b6b;
        }
        *{box-sizing:border-box}
        body{margin:0;background:var(--bg);color:var(--text);font-family:system-ui;}
        .app{height:100svh;display:flex;flex-direction:column;}

        .topbar{
          position:sticky;top:0;z-index:10;
          display:flex;justify-content:space-between;align-items:center;
          padding:12px 14px;
          background:linear-gradient(180deg,rgba(7,9,15,.98),rgba(7,9,15,.6),transparent);
          backdrop-filter: blur(8px);
        }
        .brand{display:flex;gap:10px;align-items:center;font-weight:800;}
        .logo{width:28px;height:28px;border-radius:8px;background:
          radial-gradient(circle at 30% 30%,#6d7bff,transparent 60%),
          radial-gradient(circle at 70% 70%,#22e6a5,transparent 55%),#0b1020;}
        .status{font-size:12px;background:#0e1322;border:1px solid #1a2340;padding:6px 10px;border-radius:999px;}
        .dot{display:inline-block;width:6px;height:6px;background:var(--good);border-radius:50%;margin-left:6px;}

        .chips{display:flex;gap:8px;overflow:auto;padding:6px 10px 8px;scrollbar-width:none;}
        .chip{
          flex:0 0 auto;padding:8px 12px;border-radius:999px;
          background:#0e1322;border:1px solid #1a2340;color:#c6cce0;font-size:13px;
        }
        .chip.active{background:#14203a;border-color:#27406f;color:#fff;}

        .feed{
          flex:1;overflow:auto;
          scroll-snap-type:y mandatory;
          padding-bottom:8px;
        }
        .snap-card{
          scroll-snap-align:start;
          height:calc(100svh - 140px);
          margin:0 10px 12px;
        }
        .empty{height:100%;display:grid;place-items:center;color:var(--muted)}
        .bottomnav{
          position:sticky;bottom:0;border-top:1px solid #141b33;
          background:#07090f;display:flex;justify-content:space-around;padding:10px 0;
        }
        .navitem{font-size:12px;color:#aeb6cc}
        .navitem.active{color:#fff;font-weight:700}
      `}</style>
    </div>
  );
}
