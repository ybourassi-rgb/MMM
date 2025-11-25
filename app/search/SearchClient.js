"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

export default function SearchClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI states
  const [q, setQ] = useState(sp.get("q") || "");
  const [cat, setCat] = useState(sp.get("cat") || "all");
  const [city, setCity] = useState(sp.get("city") || "");
  const [sort, setSort] = useState(sp.get("sort") || "date"); // date | score | price

  // load feed once
  useEffect(() => {
    fetch("/api/feed", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(d.items || d || []))
      .finally(() => setLoading(false));
  }, []);

  // keep URL in sync (shareable search)
  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (cat !== "all") params.set("cat", cat);
    if (city) params.set("city", city);
    if (sort !== "date") params.set("sort", sort);

    const url = `/search${params.toString() ? `?${params.toString()}` : ""}`;
    router.replace(url);
  }, [q, cat, city, sort, router]);

  // parse price if possible (ex: "29,99€" => 29.99)
  const parsePrice = (p) => {
    if (!p) return null;
    const s = String(p).replace(",", ".").replace(/[^\d.]/g, "");
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  };

  const results = useMemo(() => {
    let res = [...items];

    // search text
    if (q.trim()) {
      const qq = q.toLowerCase();
      res = res.filter((it) => {
        const text = `${it.title || ""} ${it.summary || ""} ${it.category || ""}`.toLowerCase();
        return text.includes(qq);
      });
    }

    // category filter (simple)
    if (cat !== "all") {
      res = res.filter((it) => {
        const text = `${it.category || ""} ${it.title || ""}`.toLowerCase();
        return text.includes(cat);
      });
    }

    // city filter
    if (city.trim()) {
      const cc = city.toLowerCase();
      res = res.filter((it) => String(it.city || "").toLowerCase().includes(cc));
    }

    // sorting
    if (sort === "score") {
      res.sort((a, b) => (Number(b.score || 0) - Number(a.score || 0)));
    } else if (sort === "price") {
      res.sort((a, b) => {
        const pa = parsePrice(a.price) ?? 1e18;
        const pb = parsePrice(b.price) ?? 1e18;
        return pa - pb;
      });
    } else {
      // date
      res.sort((a, b) => {
        const da = new Date(a.publishedAt || 0).getTime();
        const db = new Date(b.publishedAt || 0).getTime();
        return db - da;
      });
    }

    return res;
  }, [items, q, cat, city, sort]);

  const openDeal = (it) => {
    const finalUrl = it.affiliateUrl || it.url || it.link;
    if (!finalUrl) return;
    window.open(finalUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="wrap">
      {/* top bar */}
      <header className="top">
        <button onClick={() => router.back()} className="back">←</button>
        <h1>Recherche</h1>
      </header>

      {/* search + filters */}
      <div className="filters">
        <input
          className="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un deal (ex: iPhone, Ryanair, PS5...)"
        />

        <div className="row">
          <select value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="all">Toutes catégories</option>
            <option value="tech">High-Tech</option>
            <option value="informatique">Informatique</option>
            <option value="gaming">Gaming</option>
            <option value="maison">Maison</option>
            <option value="bricolage">Bricolage</option>
            <option value="auto">Auto</option>
            <option value="mode">Mode/Beauté</option>
            <option value="bébé">Bébé/Enfant</option>
            <option value="voyage">Voyage</option>
            <option value="gratuit">Gratuit</option>
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="date">Tri: plus récent</option>
            <option value="score">Tri: meilleur score</option>
            <option value="price">Tri: prix le + bas</option>
          </select>
        </div>

        <input
          className="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ville (optionnel)"
        />
      </div>

      {/* results */}
      {loading ? (
        <div className="loading">Chargement…</div>
      ) : (
        <div className="grid">
          {results.map((it, i) => (
            <button key={it.id || i} className="card" onClick={() => openDeal(it)}>
              <div className="img">
                {it.image ? (
                  <Image
                    src={it.image}
                    alt={it.title}
                    fill
                    sizes="220px"
                    style={{ objectFit: "contain" }}
                    unoptimized
                  />
                ) : (
                  <div className="noimg">Visuel dans le lien</div>
                )}
              </div>

              <div className="meta">
                <div className="title">{it.title}</div>
                <div className="sub">
                  {it.price ? <span className="price">{it.price}</span> : <span className="price">Prix N/A</span>}
                  {it.city && <span className="cityTag">📍 {it.city}</span>}
                </div>

                <div className="chips">
                  {it.score != null && <span className="chip">Y-Score {it.score}</span>}
                  {it.category && <span className="chip">{it.category}</span>}
                  {it.source && <span className="chip muted">{it.source}</span>}
                </div>
              </div>
            </button>
          ))}

          {!results.length && (
            <div className="empty">Aucun résultat pour cette recherche.</div>
          )}
        </div>
      )}

      <style jsx>{`
        .wrap {
          min-height: 100svh;
          background: #07090f;
          color: #fff;
          padding: 14px 14px 90px;
        }
        .top {
          position: sticky;
          top: 0;
          z-index: 5;
          background: #07090f;
          display: flex;
          align-items: center;
          gap: 10px;
          padding-bottom: 10px;
        }
        .back {
          background: #0e1322;
          border: 1px solid #1a2340;
          color: white;
          border-radius: 10px;
          padding: 6px 10px;
          font-size: 16px;
        }
        h1 {
          margin: 0;
          font-size: 18px;
          font-weight: 900;
        }

        .filters {
          display: grid;
          gap: 8px;
          margin-bottom: 12px;
        }
        .search, .city, select {
          width: 100%;
          background: #0f1422;
          border: 1px solid #1b2440;
          color: white;
          border-radius: 12px;
          padding: 12px;
          font-size: 14px;
          outline: none;
        }
        .row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .loading {
          margin-top: 30px;
          text-align: center;
          color: #aeb6cc;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .card {
          text-align: left;
          background: #0f1422;
          border: 1px solid #1b2440;
          border-radius: 14px;
          padding: 8px;
          color: white;
          display: grid;
          gap: 8px;
        }
        .img {
          position: relative;
          width: 100%;
          height: 140px;
          background: #0b1020;
          border-radius: 10px;
          overflow: hidden;
        }
        .noimg {
          height: 100%;
          display: grid;
          place-items: center;
          color: #aeb6cc;
          font-weight: 700;
          font-size: 12px;
        }

        .meta { display: grid; gap: 6px; }
        .title {
          font-size: 13px;
          font-weight: 800;
          line-height: 1.25;
          max-height: 3.8em;
          overflow: hidden;
        }
        .sub {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #c6cce0;
        }
        .price {
          font-weight: 900;
          color: #fff;
        }
        .cityTag { opacity: 0.9; }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .chip {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 7px;
          border-radius: 999px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .chip.muted { color: #aeb6cc; }

        .empty {
          grid-column: 1 / -1;
          text-align: center;
          color: #aeb6cc;
          padding: 30px 0;
        }
      `}</style>
    </div>
  );
}
