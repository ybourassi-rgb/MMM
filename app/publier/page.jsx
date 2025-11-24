"use client";

import { useState } from "react";

export default function PublierPage() {
  const [form, setForm] = useState({
    title: "",
    url: "",
    price: "",
    category: "autre",
    image: "",
    city: "",
    halal: null,
    summary: "",
  });

  const [loading, setLoading] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setOkMsg("");
    setErrMsg("");

    if (!form.title.trim() || !form.url.trim()) {
      setErrMsg("Titre et lien sont obligatoires.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.ok) throw new Error(data.error || "Erreur serveur");

      setOkMsg("Deal publié ✅ Il apparaît dans le feed.");
      setForm({
        title: "",
        url: "",
        price: "",
        category: "autre",
        image: "",
        city: "",
        halal: null,
        summary: "",
      });
    } catch (e2) {
      setErrMsg(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrap">
      <header className="top">
        <h1>Publier un deal</h1>
        <p>Ajoute ton bon plan. Il sera visible dans le feed.</p>
      </header>

      <form className="card" onSubmit={onSubmit}>
        <label>
          Titre *
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            placeholder="Ex: iPhone 15 Pro - super promo"
            required
          />
        </label>

        <label>
          Lien *
          <input
            name="url"
            value={form.url}
            onChange={onChange}
            placeholder="https://..."
            required
          />
        </label>

        <div className="row">
          <label>
            Prix (optionnel)
            <input
              name="price"
              value={form.price}
              onChange={onChange}
              placeholder="Ex: 299€"
            />
          </label>

          <label>
            Ville (optionnel)
            <input
              name="city"
              value={form.city}
              onChange={onChange}
              placeholder="Ex: Marrakech"
            />
          </label>
        </div>

        <label>
          Catégorie
          <select name="category" value={form.category} onChange={onChange}>
            <option value="autre">Autre</option>
            <option value="auto">Auto</option>
            <option value="immo">Immo</option>
            <option value="voyage">Voyage</option>
            <option value="tech">Tech</option>
            <option value="gaming">Gaming</option>
            <option value="business">Business</option>
          </select>
        </label>

        <label>
          Image (URL optionnelle)
          <input
            name="image"
            value={form.image}
            onChange={onChange}
            placeholder="https://...jpg/png"
          />
        </label>

        <label>
          Petit résumé (optionnel)
          <textarea
            name="summary"
            value={form.summary}
            onChange={onChange}
            placeholder="Explique vite fait pourquoi c’est une bonne affaire"
            rows={4}
          />
        </label>

        {errMsg && <div className="err">{errMsg}</div>}
        {okMsg && <div className="ok">{okMsg}</div>}

        <button className="btn" disabled={loading}>
          {loading ? "Publication..." : "Publier"}
        </button>
      </form>

      <style jsx>{`
        .wrap {
          min-height: 100svh;
          background: #07090f;
          color: #e9ecf5;
          padding: 14px;
        }
        .top h1 {
          margin: 0 0 4px 0;
          font-size: 22px;
          font-weight: 800;
        }
        .top p {
          margin: 0 0 12px 0;
          color: #8b93a7;
          font-size: 13px;
        }
        .card {
          background: #0f1422;
          border: 1px solid #1b2440;
          border-radius: 14px;
          padding: 12px;
          display: grid;
          gap: 10px;
        }
        label {
          display: grid;
          gap: 6px;
          font-size: 12px;
          color: #cbd3e7;
        }
        input, select, textarea {
          width: 100%;
          background: #0b1020;
          border: 1px solid #1b2440;
          color: #fff;
          border-radius: 10px;
          padding: 10px;
          outline: none;
          font-size: 14px;
        }
        .row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .btn {
          margin-top: 6px;
          background: #112449;
          border: 1px solid #27406f;
          color: #e7f0ff;
          padding: 12px;
          border-radius: 12px;
          font-weight: 800;
          cursor: pointer;
        }
        .btn:disabled { opacity: .6; cursor: not-allowed; }
        .err {
          background: rgba(255, 80, 80, .12);
          border: 1px solid rgba(255, 80, 80, .4);
          padding: 8px;
          border-radius: 10px;
          font-size: 13px;
        }
        .ok {
          background: rgba(24, 212, 123, .12);
          border: 1px solid rgba(24, 212, 123, .4);
          padding: 8px;
          border-radius: 10px;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}
