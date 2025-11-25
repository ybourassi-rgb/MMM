"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  "Cartes / Collections",
  "High-Tech",
  "Auto / Moto",
  "Immobilier",
  "Mode / Luxe",
  "Maison / Déco",
  "Art / Antiquités",
  "Autre",
];

export default function PublishAuctionPage() {
  const router = useRouter();

  // =========================
  // Form state
  // =========================
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");

  const [startPrice, setStartPrice] = useState("");
  const [reservePrice, setReservePrice] = useState("");
  const [buyNowPrice, setBuyNowPrice] = useState("");

  const [location, setLocation] = useState("");
  const [shipping, setShipping] = useState("pickup"); // pickup | shipping
  const [endAt, setEndAt] = useState(""); // date ISO

  const [images, setImages] = useState([]); // local previews base64
  const [imgOk, setImgOk] = useState(true);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");

  // =========================
  // Helpers images
  // =========================
  const onPickImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const readAsDataURL = (file) =>
      new Promise((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.readAsDataURL(file);
      });

    const previews = await Promise.all(files.map(readAsDataURL));
    setImages((prev) => [...prev, ...previews].slice(0, 6)); // max 6 images
  };

  const removeImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // preview cover
  const cover = useMemo(() => images[0] || "/placeholders/IMG_2362.png", [images]);

  // =========================
  // Submit
  // =========================
  const onSubmit = async () => {
    setErr("");
    setOkMsg("");

    if (!title.trim()) return setErr("Ajoute un titre.");
    if (!startPrice) return setErr("Ajoute un prix de départ.");
    if (!endAt) return setErr("Choisis une date de fin.");

    setLoading(true);
    try {
      const payload = {
        type: "auction",
        title: title.trim(),
        category,
        description: description.trim(),
        startPrice: Number(startPrice),
        reservePrice: reservePrice ? Number(reservePrice) : null,
        buyNowPrice: buyNowPrice ? Number(buyNowPrice) : null,
        location: location.trim() || null,
        shipping,
        images, // pour l’instant base64 (on optimisera après)
        endAt,
        createdAt: Date.now(),
      };

      // ✅ on utilisera /api/auction/publish (à créer ensuite)
      const res = await fetch("/api/auction/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Publication échouée");
      }

      setOkMsg("✅ Enchère publiée !");
      // redirige vers accueil ou page enchère
      router.push("/");
    } catch (e) {
      setErr(e.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrap">
      {/* TOP */}
      <header className="top">
        <button className="back" onClick={() => router.back()}>←</button>
        <div className="title">
          <h1>Publier une enchère</h1>
          <p>Mode haute gamme — Le Bon Souk</p>
        </div>
      </header>

      <div className="grid">
        {/* =========================
            LEFT: FORM
        ========================= */}
        <section className="panel">
          <div className="section-title">Infos de l’enchère</div>

          <label className="label">Titre</label>
          <input
            className="input"
            placeholder="ex: Carte Pokémon Dracaufeu 1ère édition"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
          />

          <label className="label">Catégorie</label>
          <select
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <label className="label">Description</label>
          <textarea
            className="input area"
            placeholder="Décris l’état, l’authenticité, ce qui est inclus, etc."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />

          <div className="row2">
            <div>
              <label className="label">Prix de départ (€)</label>
              <input
                className="input"
                type="number"
                min="0"
                placeholder="ex: 50"
                value={startPrice}
                onChange={(e) => setStartPrice(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Prix de réserve (€)</label>
              <input
                className="input"
                type="number"
                min="0"
                placeholder="optionnel"
                value={reservePrice}
                onChange={(e) => setReservePrice(e.target.value)}
              />
            </div>
          </div>

          <label className="label">Achat immédiat (€)</label>
          <input
            className="input"
            type="number"
            min="0"
            placeholder="optionnel"
            value={buyNowPrice}
            onChange={(e) => setBuyNowPrice(e.target.value)}
          />

          <div className="row2">
            <div>
              <label className="label">Localisation</label>
              <input
                className="input"
                placeholder="Ville / Pays"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Livraison</label>
              <select
                className="input"
                value={shipping}
                onChange={(e) => setShipping(e.target.value)}
              >
                <option value="pickup">Remise en main propre</option>
                <option value="shipping">Envoi possible</option>
              </select>
            </div>
          </div>

          <label className="label">Fin de l’enchère</label>
          <input
            className="input"
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
          />

          {/* IMAGES */}
          <div className="section-title" style={{ marginTop: 16 }}>
            Photos (max 6)
          </div>

          <input
            className="input"
            type="file"
            accept="image/*"
            multiple
            onChange={onPickImages}
          />

          {!!images.length && (
            <div className="thumbs">
              {images.map((src, i) => (
                <div key={i} className="thumb">
                  <Image src={src} alt="" fill style={{ objectFit: "cover" }} unoptimized />
                  <button className="thumb-x" onClick={() => removeImage(i)}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* ERR / OK */}
          {err && <div className="error">Erreur: {err}</div>}
          {okMsg && <div className="ok">{okMsg}</div>}

          <button className="submit" onClick={onSubmit} disabled={loading}>
            {loading ? "Publication..." : "Publier l’enchère"}
          </button>
        </section>

        {/* =========================
            RIGHT: PREVIEW
        ========================= */}
        <section className="preview">
          <div className="preview-card">
            <div className="media">
              <Image
                src={cover}
                alt={title || "Prévisualisation"}
                fill
                onError={() => setImgOk(false)}
                style={{ objectFit: "contain" }}
                unoptimized
              />
              <div className="media-grad" />
              <div className="media-top">
                {!!category && <div className="chip">{category}</div>}
                {!!location && <div className="chip">📍 {location}</div>}
                {!!endAt && (
                  <div className="chip">
                    Fin: {new Date(endAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            <div className="content">
              <h2>{title || "Titre de l’enchère"}</h2>
              <p className="desc">
                {description || "Ta description s’affichera ici…"}
              </p>

              <div className="prices">
                <div className="price-box">
                  <div className="price-label">Départ</div>
                  <div className="price-val">
                    {startPrice ? `${startPrice}€` : "—"}
                  </div>
                </div>

                <div className="price-box">
                  <div className="price-label">Réserve</div>
                  <div className="price-val">
                    {reservePrice ? `${reservePrice}€` : "—"}
                  </div>
                </div>

                <div className="price-box">
                  <div className="price-label">Achat immédiat</div>
                  <div className="price-val">
                    {buyNowPrice ? `${buyNowPrice}€` : "—"}
                  </div>
                </div>
              </div>

              <div className="meta">
                <div>Livraison: {shipping === "shipping" ? "Envoi possible" : "Main propre"}</div>
              </div>
            </div>
          </div>

          <div className="preview-hint">
            Ceci est la carte “haute gamme” que verront les acheteurs.
          </div>
        </section>
      </div>

      <style jsx>{`
        .wrap{
          min-height:100svh;
          background:#07090f;
          color:white;
          padding:14px 14px 90px;
        }
        .top{
          display:flex; align-items:center; gap:10px; margin-bottom:12px;
        }
        .back{
          background:#0e1322; border:1px solid #1a2340; color:white;
          border-radius:10px; padding:6px 10px; font-size:16px;
        }
        .title h1{ margin:0; font-size:18px; font-weight:900; }
        .title p{ margin:2px 0 0; font-size:12px; opacity:.7; }

        .grid{
          display:grid; gap:12px;
          grid-template-columns: 1.2fr .8fr;
        }
        @media (max-width: 980px){
          .grid{ grid-template-columns:1fr; }
        }

        .panel{
          background:#0f1422; border:1px solid rgba(255,255,255,.06);
          border-radius:16px; padding:14px;
        }

        .section-title{
          font-size:13px; font-weight:900; opacity:.9; margin-bottom:8px;
        }
        .label{ font-size:12px; opacity:.8; font-weight:800; display:block; margin-top:8px; }
        .input{
          width:100%; margin-top:6px; padding:10px 11px; border-radius:12px;
          background:#0b1020; border:1px solid rgba(255,255,255,.08);
          color:white; outline:none; font-size:14px;
        }
        .input.area{ resize:vertical; min-height:110px; line-height:1.5; }
        .row2{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }

        .thumbs{
          margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;
        }
        .thumb{
          position:relative; width:92px; height:92px; border-radius:10px; overflow:hidden;
          border:1px solid rgba(255,255,255,.12);
          background:#0b1020;
        }
        .thumb-x{
          position:absolute; top:4px; right:4px; z-index:2;
          background:rgba(0,0,0,.6); border:1px solid rgba(255,255,255,.2);
          color:white; border-radius:8px; font-size:12px; padding:2px 6px;
        }

        .error{
          margin-top:10px; background:rgba(255,107,107,0.12);
          border:1px solid rgba(255,107,107,0.4);
          padding:10px; border-radius:12px; font-size:14px;
        }
        .ok{
          margin-top:10px; background:rgba(24,212,123,0.12);
          border:1px solid rgba(24,212,123,0.4);
          padding:10px; border-radius:12px; font-size:14px;
        }

        .submit{
          margin-top:12px; width:100%; padding:12px; border-radius:12px;
          background:linear-gradient(90deg, rgba(78,163,255,.18), rgba(34,230,165,.18)), #0e1322;
          border:1px solid rgba(78,163,255,.55);
          font-weight:900; color:white; font-size:15px;
          box-shadow:0 10px 30px rgba(0,0,0,.6);
        }
        .submit:disabled{ opacity:.6; }

        .preview{
          position:sticky; top:70px; height:fit-content;
        }
        .preview-card{
          background:#0f1422; border:1px solid rgba(78,163,255,.22);
          border-radius:18px; overflow:hidden; box-shadow:0 15px 45px rgba(0,0,0,.55);
        }
        .media{
          position:relative; height:260px; background:#0b1020;
        }
        .media-grad{
          position:absolute; inset:0;
          background:linear-gradient(180deg, rgba(0,0,0,.0), rgba(0,0,0,.7));
        }
        .media-top{
          position:absolute; top:10px; left:10px; display:flex; gap:6px; flex-wrap:wrap; z-index:2;
        }
        .chip{
          background:rgba(10,14,25,.7); border:1px solid rgba(255,255,255,.1);
          padding:.3rem .6rem; border-radius:999px; font-size:11px; font-weight:800;
          box-shadow:0 6px 22px rgba(0,0,0,.35); backdrop-filter:blur(6px);
        }
        .content{ padding:12px; }
        .content h2{ margin:0; font-size:17px; font-weight:900; }
        .desc{
          margin-top:6px; font-size:13px; opacity:.9; line-height:1.45;
          display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden;
        }
        .prices{
          margin-top:10px; display:grid; grid-template-columns:repeat(3,1fr); gap:6px;
        }
        .price-box{
          background:rgba(0,0,0,.35); border:1px solid rgba(255,255,255,.08);
          border-radius:12px; padding:10px; text-align:center;
        }
        .price-label{ font-size:11px; opacity:.8; font-weight:800; }
        .price-val{ margin-top:4px; font-weight:900; font-size:16px; }

        .meta{ margin-top:8px; font-size:12px; opacity:.8; }
        .preview-hint{ margin-top:8px; font-size:12px; opacity:.7; }
      `}</style>
    </div>
  );
}
