"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PublishPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState("autre");
  const [type, setType] = useState("occasion");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!title || !url) return alert("Titre + lien obligatoires");

    setLoading(true);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          url,
          image,
          category,
          type,
          price,
          city,
        }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Erreur publish");

      alert("Deal publié ✅");
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
        <h1>Publier un deal</h1>
      </header>

      <form className="form" onSubmit={onSubmit}>
        <label>
          Titre *
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: iPhone 15 Pro - super prix"
          />
        </label>

        <label>
          Lien *
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
          />
        </label>

        <label>
          Image (optionnel)
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://image.jpg"
          />
        </label>

        <label>
          Prix (optionnel)
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Ex: 120€"
          />
        </label>

        <label>
          Type d’annonce
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="occasion">Occasion</option>
            <option value="neuf">Neuf</option>
            <option value="service">Service</option>
          </select>
        </label>

        <label>
          Catégorie
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="autre">Autre</option>
            <option value="auto">Auto</option>
            <option value="immo">Immo</option>
            <option value="crypto">Crypto</option>
            <option value="voyage">Voyage</option>
            <option value="tech">Tech</option>
            <option value="gaming">Gaming</option>
            <option value="maison">Maison</option>
            <option value="famille">Famille</option>
            <option value="mode">Mode / Sport</option>
          </select>
        </label>

        <label>
          Ville (optionnel)
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Paris, Lyon..."
          />
        </label>

        <button disabled={loading} className="submit">
          {loading ? "Publication..." : "Publier ✅"}
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
          font-weight: 800;
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
        input, select {
          background: #0f1422;
          border: 1px solid #1b2440;
          color: white;
          border-radius: 12px;
          padding: 12px;
          font-size: 14px;
          outline: none;
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
        .submit:disabled { opacity: .6; }
      `}</style>
    </div>
  );
}
