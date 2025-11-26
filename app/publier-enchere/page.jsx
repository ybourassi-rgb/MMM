"use client";

import { useState } from "react";
import BottomNav from "@/components/BottomNav";

export default function PublierEncherePage() {
  const [form, setForm] = useState({
    title: "",
    url: "",
    images: "",

    startingPrice: "",
    bidStep: "",
    endAt: "",

    category: "autre",
    city: "",
    summary: "",
    seller: "",
    contact: "",
  });

  const [loading, setLoading] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setOkMsg("");
    setErrMsg("");

    try {
      const imagesArr = form.images
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      // ✅ IMPORTANT: au moins 1 image sinon feed la filtre
      if (!imagesArr.length) {
        throw new Error("Ajoute au moins 1 image (URL) sinon l’enchère n’apparaît pas.");
      }

      const payload = {
        ...form,
        images: imagesArr,
        image: imagesArr[0], // ✅ alias pour le feed

        startingPrice: form.startingPrice ? Number(form.startingPrice) : null,
        bidStep: form.bidStep ? Number(form.bidStep) : null,

        // ✅ on force ISO pour éviter un parsing foireux
        endAt: form.endAt ? new Date(form.endAt).toISOString() : null,

        type: "auction",
        auction: true, // ✅ bonus (pas obligatoire mais clair)
        source: "community-auction",
      };

      const r = await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const d = await r.json();
      if (!r.ok || !d.ok) {
        throw new Error(d.error || "publish_failed");
      }

      setOkMsg("Enchère publiée ✅ Elle apparaît dans le feed.");
      setForm({
        title: "",
        url: "",
        images: "",
        startingPrice: "",
        bidStep: "",
        endAt: "",
        category: "autre",
        city: "",
        summary: "",
        seller: "",
        contact: "",
      });
    } catch (err) {
      setErrMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <div className="logo" />
          <span>Publier une enchère</span>
        </div>
      </header>

      <main className="wrap">
        <form onSubmit={submit} className="card">
          <label>
            Titre *
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Carte Pokémon Dracaufeu..."
              required
            />
          </label>

          <label>
            Lien *
            <input
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://..."
              required
            />
          </label>

          <label>
            Images (1 par ligne) *
            <textarea
              rows={3}
              value={form.images}
              onChange={(e) => set("images", e.target.value)}
              placeholder="https://image1.jpg\nhttps://image2.jpg"
              required
            />
          </label>

          <div className="row">
            <label>
              Prix de départ
              <input
                type="number"
                value={form.startingPrice}
                onChange={(e) => set("startingPrice", e.target.value)}
                placeholder="50"
              />
            </label>

            <label>
              Pas d’enchère
              <input
                type="number"
                value={form.bidStep}
                onChange={(e) => set("bidStep", e.target.value)}
                placeholder="5"
              />
            </label>
          </div>

          <label>
            Fin de l’enchère (date/heure)
            <input
              type="datetime-local"
              value={form.endAt}
              onChange={(e) => set("endAt", e.target.value)}
            />
          </label>

          <div className="row">
            <label>
              Catégorie
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                <option value="autre">Autre</option>
                <option value="tech">Tech</option>
                <option value="home">Maison</option>
                <option value="auto">Auto</option>
                <option value="travel">Voyage</option>
                <option value="family">Famille/Bébé</option>
                <option value="lifestyle">Lifestyle/Collection</option>
              </select>
            </label>

            <label>
              Ville
              <input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Paris"
              />
            </label>
          </div>

          <label>
            Description / résumé
            <textarea
              rows={4}
              value={form.summary}
              onChange={(e) => set("summary", e.target.value)}
              placeholder="État, rareté, détails..."
            />
          </label>

          <div className="row">
            <label>
              Vendeur
              <input
                value={form.seller}
                onChange={(e) => set("seller", e.target.value)}
                placeholder="Pseudo"
              />
            </label>

            <label>
              Contact
              <input
                value={form.contact}
                onChange={(e) => set("contact", e.target.value)}
                placeholder="email / tel"
              />
            </label>
          </div>

          <button className="btn" disabled={loading}>
            {loading ? "Publication..." : "Publier l’enchère"}
          </button>

          {okMsg && <div className="ok">{okMsg}</div>}
          {errMsg && <div className="err">Erreur: {errMsg}</div>}
        </form>
      </main>

      <BottomNav />

      <style jsx global>{`
        .page {
          min-height: 100svh;
          background: #07090f;
          color: #e9ecf5;
          padding-bottom: 110px;
        }
        .topbar {
          position: sticky; top: 0; z-index: 10;
          display: flex; align-items: center;
          padding: 12px 14px;
          background: rgba(7,9,15,0.95);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(8px);
        }
        .brand { display: flex; gap: 10px; align-items: center; font-weight: 900; }
        .logo {
          width: 28px; height: 28px; border-radius: 8px;
          background:
            radial-gradient(circle at 30% 30%, #6d7bff, transparent 60%),
            radial-gradient(circle at 70% 70%, #22e6a5, transparent 55%),
            #0b1020;
        }

        .wrap { display: grid; place-items: center; padding: 14px; }
        .card {
          width: min(720px, 100%);
          background: #0f1422;
          border: 1px solid rgba(78,163,255,0.18);
          border-radius: 16px;
          padding: 14px;
          display: flex; flex-direction: column; gap: 10px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.6);
        }
        label { display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 800; }
        input, textarea, select {
          background: #0b1020;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 10px;
          font-size: 14px;
          outline: none;
        }
        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .btn {
          margin-top: 6px;
          background: linear-gradient(90deg, #4ea3ff, #22e6a5);
          color: #051018;
          font-weight: 900;
          border: none; border-radius: 12px;
          padding: 12px;
          font-size: 15px;
          cursor: pointer;
        }
        .btn:disabled { opacity: .6; cursor: not-allowed; }
        .ok { margin-top: 6px; color: #00e389; font-weight: 800; }
        .err { margin-top: 6px; color: #ff6b6b; font-weight: 800; }
      `}</style>
    </div>
  );
}
