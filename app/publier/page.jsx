"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function PublishPage() {
  const router = useRouter();

  // ===== mode =====
  const [mode, setMode] = useState("deal"); // "deal" | "auction"

  // ===== commun =====
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState(""); // lien direct si dispo
  const [imageFile, setImageFile] = useState(null); // upload
  const [preview, setPreview] = useState(null);

  const [category, setCategory] = useState("autre");
  const [condition, setCondition] = useState("neuf");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");

  // ✅ vendeur simple (stocké localement)
  const [sellerName, setSellerName] = useState("");

  // ✅ coords pour "autour de moi"
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  const [loading, setLoading] = useState(false);

  // ===== enchère (nouveaux champs) =====
  const [startingPrice, setStartingPrice] = useState(""); // mise à prix
  const [bidStep, setBidStep] = useState("");             // pas d’enchère
  const [endsAt, setEndsAt] = useState("");               // datetime-local

  // récupérer pseudo vendeur déjà utilisé
  useEffect(() => {
    const saved = localStorage.getItem("sellerName");
    if (saved) setSellerName(saved);
  }, []);

  // géoloc auto (si accepté)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: false, timeout: 6000 }
    );
  }, []);

  // ===== Upload téléphone -> base64 =====
  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // garde-fou taille (base64 sinon trop lourd pour Upstash)
    if (file.size > 700 * 1024) {
      alert("Image trop lourde. Choisis une photo plus légère (moins de 700KB).");
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const finalImage = useMemo(() => preview || imageUrl?.trim() || null, [preview, imageUrl]);

  const canSubmit = useMemo(() => {
    if (!sellerName || !title || !url) return false;
    if (!finalImage) return false;

    if (mode === "auction") {
      if (!startingPrice) return false;
      if (!endsAt) return false;
    }
    return true;
  }, [sellerName, title, url, finalImage, mode, startingPrice, endsAt]);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!canSubmit) {
      return alert("Champs obligatoires manquants.");
    }

    setLoading(true);
    try {
      const endpoint = mode === "deal" ? "/api/publish" : "/api/auctions";

      const body =
        mode === "deal"
          ? {
              sellerName,
              title,
              url,
              image: finalImage,
              category,
              condition,
              price,
              city,
              summary: description,  // ✅ on garde ta clé mais on aligne côté feed
              description,
              lat,
              lng,
              source: "community",
            }
          : {
              sellerName,
              title,
              url,
              images: finalImage ? [finalImage] : [],
              image: finalImage,
              category,
              city,
              summary: description,
              description,
              lat,
              lng,

              // ✅ champs enchère
              startingPrice: Number(startingPrice),
              bidStep: bidStep ? Number(bidStep) : null,
              endAt: new Date(endsAt).toISOString(),

              type: "auction",
              auction: true,
              source: "community-auction",
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Erreur publish");

      // ✅ mémorise vendeur
      localStorage.setItem("sellerName", sellerName);

      alert(mode === "deal" ? "Annonce publiée ✅" : "Enchère publiée ✅");
      router.push("/");
    } catch (e) {
      alert("Erreur: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrap">
      <header className="top">
        <button onClick={() => router.back()} className="back">←</button>
        <h1>{mode === "deal" ? "Publier une annonce" : "Publier une enchère"}</h1>
      </header>

      {/* ✅ switch mode */}
      <div className="modeTabs">
        <button
          type="button"
          className={`tab ${mode === "deal" ? "active" : ""}`}
          onClick={() => setMode("deal")}
        >
          💸 Prix fixe
        </button>
        <button
          type="button"
          className={`tab ${mode === "auction" ? "active" : ""}`}
          onClick={() => setMode("auction")}
        >
          🔨 Enchère
        </button>
      </div>

      <form className="form" onSubmit={onSubmit}>
        {/* ✅ vendeur */}
        <label>
          Pseudo vendeur *
          <input
            value={sellerName}
            onChange={(e) => setSellerName(e.target.value)}
            placeholder="Ex: Yassine93"
          />
        </label>

        {/* ===== Titre ===== */}
        <label>
          Titre *
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Carte Pokémon rare"
          />
        </label>

        {/* ===== Lien ===== */}
        <label>
          Lien *
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
          />
        </label>

        {/* ===== PRIX FIXE seulement ===== */}
        {mode === "deal" && (
          <>
            <label>
              Prix (€)
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ex: 799"
                inputMode="numeric"
              />
            </label>

            <label>
              État
              <select value={condition} onChange={(e) => setCondition(e.target.value)}>
                <option value="neuf">Neuf</option>
                <option value="comme-neuf">Comme neuf</option>
                <option value="bon-etat">Bon état</option>
                <option value="occasion">Occasion</option>
              </select>
            </label>
          </>
        )}

        {/* ===== ENCHÈRE seulement ===== */}
        {mode === "auction" && (
          <div className="auctionBox">
            <label>
              Mise à prix (€) *
              <input
                type="number"
                min="0"
                step="1"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                placeholder="Ex: 50"
              />
            </label>

            <label>
              Pas d’enchère (€)
              <input
                type="number"
                min="0"
                step="1"
                value={bidStep}
                onChange={(e) => setBidStep(e.target.value)}
                placeholder="Ex: 5"
              />
            </label>

            <label>
              Fin de l’enchère *
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </label>
          </div>
        )}

        {/* ===== Catégorie ===== */}
        <label>
          Catégorie
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="autre">Autre</option>
            <option value="auto">Auto</option>
            <option value="immo">Immobilier</option>
            <option value="voyage">Voyage</option>
            <option value="tech">High-tech</option>
            <option value="gaming">Gaming</option>
            <option value="maison">Maison / Jardin</option>
            <option value="mode">Mode / Collection</option>
            <option value="sport">Sport</option>
            <option value="bebe">Bébé / Enfant</option>
            <option value="service">Services</option>
          </select>
        </label>

        {/* ===== Ville ===== */}
        <label>
          Ville (optionnel)
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Paris, Lyon…"
          />
        </label>

        {/* ===== Description ===== */}
        <label>
          Description (optionnel)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Détaille l’offre / l’enchère…"
            rows={4}
          />
        </label>

        {/* ===== Image URL ===== */}
        <label>
          Image (URL)
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://image.jpg"
          />
        </label>

        {/* ===== OU Upload fichier ===== */}
        <label className="fileLabel">
          Ou choisir une photo (téléphone)
          <input type="file" accept="image/*" onChange={onPickFile} />
        </label>

        {/* preview */}
        {preview && (
          <div className="previewBox">
            <img src={preview} alt="preview" />
            <div className="previewHint">✅ Photo prête</div>
          </div>
        )}

        <button disabled={!canSubmit || loading} className="submit">
          {loading ? "Publication..." : (mode === "deal" ? "Publier ✅" : "Publier l’enchère 🔨")}
        </button>
      </form>

      <style jsx>{`
        .wrap {
          min-height: 100svh;
          background: #07090f;
          color: white;
          padding: 14px;
        }
        .top {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
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

        .modeTabs{
          display:flex;
          gap:8px;
          margin-bottom:10px;
        }
        .tab{
          flex:1;
          padding:10px 12px;
          border-radius:12px;
          background:#0f1422;
          border:1px solid #1b2440;
          color:#cfd5e8;
          font-weight:900;
        }
        .tab.active{
          color:white;
          border-color: rgba(78,163,255,0.7);
          box-shadow: 0 8px 25px rgba(78,163,255,0.18);
        }

        .form {
          display: grid;
          gap: 12px;
        }
        label {
          display: grid;
          gap: 6px;
          font-size: 12px;
          color: #aeb6cc;
        }

        input, select, textarea {
          background: #0f1422;
          border: 1px solid #1b2440;
          color: white;
          border-radius: 12px;
          padding: 12px;
          font-size: 14px;
          outline: none;
        }

        textarea { resize: vertical; }

        .fileLabel input {
          padding: 8px;
          background: transparent;
          border: none;
        }

        .auctionBox{
          border:1px dashed rgba(255,180,84,0.35);
          background: rgba(255,180,84,0.06);
          padding:10px;
          border-radius:12px;
          display:grid;
          gap:12px;
        }

        .previewBox {
          border: 1px dashed #27406f;
          border-radius: 12px;
          padding: 8px;
          display: grid;
          gap: 6px;
          justify-items: center;
        }
        .previewBox img {
          max-width: 100%;
          max-height: 220px;
          border-radius: 10px;
          object-fit: contain;
        }
        .previewHint {
          font-size: 12px;
          color: #00e389;
          font-weight: 800;
        }

        .submit {
          margin-top: 6px;
          background: #112449;
          border: 1px solid #27406f;
          color: white;
          padding: 12px;
          border-radius: 12px;
          font-weight: 900;
          font-size: 15px;
        }
        .submit:disabled {
          opacity: .6;
        }
      `}</style>
    </div>
  );
}
