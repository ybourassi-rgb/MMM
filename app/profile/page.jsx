"use client";

import { useEffect, useMemo, useState } from "react";
import DealSlide from "@/components/DealSlide";

function haversineKm(a, b) {
  if (!a?.lat || !a?.lng || !b?.lat || !b?.lng) return Infinity;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default function ProfilePage() {
  const [seller, setSeller] = useState("");
  const [items, setItems] = useState([]);
  const [cityFilter, setCityFilter] = useState("");
  const [radiusKm, setRadiusKm] = useState(25);
  const [myPos, setMyPos] = useState(null);

  // ✅ récupère vendeur depuis localStorage (si déjà publié une fois)
  useEffect(() => {
    const saved = localStorage.getItem("sellerName") || "";
    if (saved) setSeller(saved);
  }, []);

  // ✅ garde en mémoire vendeur courant
  useEffect(() => {
    if (seller) localStorage.setItem("sellerName", seller);
  }, [seller]);

  const loadDeals = async () => {
    if (!seller.trim()) return;
    const res = await fetch(`/api/my-deals?seller=${encodeURIComponent(seller.trim())}`, {
      cache: "no-store",
    });
    const data = await res.json();
    setItems(data.items || []);
  };

  // ✅ géoloc "autour de moi"
  const askGeo = () => {
    if (!navigator.geolocation) return alert("Géolocalisation non supportée.");
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setMyPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => alert("Position refusée."),
      { enableHighAccuracy: false, timeout: 6000 }
    );
  };

  const filtered = useMemo(() => {
    let out = items;

    // filtre ville simple
    if (cityFilter.trim()) {
      const c = cityFilter.trim().toLowerCase();
      out = out.filter((it) => (it.city || "").toLowerCase().includes(c));
    }

    // filtre autour de moi si coords dispo
    if (myPos) {
      out = out.filter((it) => {
        const d = haversineKm(myPos, { lat: it.lat, lng: it.lng });
        return d <= radiusKm;
      });
    }

    // tri récent d’abord
    out = [...out].sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
    return out;
  }, [items, cityFilter, myPos, radiusKm]);

  return (
    <div className="wrap">
      <h1 className="title">Profil vendeur</h1>

      <div className="card">
        <label>Pseudo vendeur</label>
        <input
          value={seller}
          onChange={(e) => setSeller(e.target.value)}
          placeholder="Ex: Yassine93"
        />
        <button onClick={loadDeals} className="btn">
          Voir mes annonces
        </button>
      </div>

      <div className="card">
        <label>Filtrer par ville</label>
        <input
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          placeholder="Paris, Lyon..."
        />

        <div className="row">
          <button onClick={askGeo} className="btn ghost">
            Autour de moi 📍
          </button>

          {myPos && (
            <>
              <select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))}>
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
              </select>
              <button onClick={() => setMyPos(null)} className="btn ghost">
                Désactiver
              </button>
            </>
          )}
        </div>
      </div>

      {!filtered.length && (
        <div className="empty">
          Aucune annonce trouvée pour ce vendeur / filtre.
        </div>
      )}

      <div className="list">
        {filtered.map((it, i) => (
          <div key={it.id || i} className="mini">
            <DealSlide item={it} active={false} />
          </div>
        ))}
      </div>

      <style jsx>{`
        .wrap {
          min-height: 100svh;
          background: #07090f;
          color: white;
          padding: 14px;
        }
        .title {
          margin: 0 0 10px;
          font-size: 20px;
          font-weight: 900;
        }
        .card {
          background: #0f1422;
          border: 1px solid #1b2440;
          border-radius: 14px;
          padding: 12px;
          margin-bottom: 10px;
          display: grid;
          gap: 8px;
        }
        label {
          font-size: 12px;
          color: #aeb6cc;
        }
        input, select {
          background: #0b1020;
          border: 1px solid #243054;
          color: white;
          border-radius: 10px;
          padding: 10px;
          font-size: 14px;
        }
        .row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }
        .btn {
          background: #112449;
          border: 1px solid #27406f;
          color: white;
          padding: 10px 12px;
          border-radius: 10px;
          font-weight: 800;
        }
        .btn.ghost {
          background: transparent;
          border: 1px dashed #27406f;
        }
        .empty {
          padding: 18px;
          text-align: center;
          color: #8b93a7;
        }
        .list {
          display: grid;
          gap: 12px;
        }
        .mini {
          height: 70vh; /* mini-feed scrollable */
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #141b33;
        }
      `}</style>
    </div>
  );
}
