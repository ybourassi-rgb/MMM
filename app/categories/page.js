"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function CategoriesPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // mêmes catégories que la home (cohérence)
  const CATEGORIES = [
    { key: "all", label: "🔥 Tous", match: [] },
    { key: "good", label: "💥 Bonnes affaires", match: ["deal", "promo", "réduction", "soldes", "bon plan"] },

    { key: "tech", label: "📱 High-Tech", match: ["tech", "high-tech", "smartphone", "iphone", "samsung", "xiaomi", "android", "apple"] },
    { key: "it", label: "💻 Informatique", match: ["pc", "ordinateur", "laptop", "ssd", "ryzen", "intel", "ram", "gpu", "carte graphique"] },
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

  // charge le feed (on se base sur /api/feed)
  useEffect(() => {
    fetch("/api/feed", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items || d || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // comptage par catégorie (local, rapide)
  const counts = useMemo(() => {
    const map = {};
    for (const cat of CATEGORIES) map[cat.key] = 0;
    map.all = items.length;

    for (const it of items) {
      const text = `${it.category || ""} ${it.title || ""} ${it.summary || ""}`.toLowerCase();

      for (const cat of CATEGORIES) {
        if (cat.key === "all") continue;
        if (cat.match?.some((w) => text.includes(w.toLowerCase()))) {
          map[cat.key] = (map[cat.key] || 0) + 1;
        }
      }
    }
    return map;
  }, [items]);

  const openCategory = (key) => {
    // on renvoie vers le feed avec un param
    router.push(`/?cat=${key}`);
  };

  return (
    <div className="wrap">
      <header className="top">
        <button onClick={() => router.back()} className="back">←</button>
        <h1>Catégories</h1>
      </header>

      {loading ? (
        <div className="loading">Chargement des catégories...</div>
      ) : (
        <div className="grid">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              className="card"
              onClick={() => openCategory(c.key)}
            >
              <div className="label">{c.label}</div>
              <div className="count">
                {counts[c.key] ?? 0} deal{(counts[c.key] ?? 0) > 1 ? "s" : ""}
              </div>
            </button>
          ))}
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
        .loading {
          margin-top: 30px;
          color: #aeb6cc;
          text-align: center;
        }

        .grid {
          margin-top: 10px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .card {
          text-align: left;
          background: #0f1422;
          border: 1px solid #1b2440;
          border-radius: 14px;
          padding: 14px;
          color: white;
          display: grid;
          gap: 6px;
        }
        .label {
          font-weight: 800;
          font-size: 14px;
        }
        .count {
          font-size: 12px;
          color: #aeb6cc;
        }
      `}</style>
    </div>
  );
}
