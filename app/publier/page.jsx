"use client";

import { useState } from "react";

export default function PublierPage() {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [image, setImage] = useState("");
  const [price, setPrice] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();

    const payload = { title, url, image, price };

    // Pour l’instant on log juste
    console.log("NEW DEAL:", payload);

    alert("Deal envoyé ✅ (pour l’instant en local)");
    setTitle(""); setUrl(""); setImage(""); setPrice("");
  };

  return (
    <div className="pwrap">
      <h1>Publier un deal</h1>

      <form onSubmit={onSubmit} className="form">
        <label>
          Titre du deal
          <input value={title} onChange={(e)=>setTitle(e.target.value)} required />
        </label>

        <label>
          Lien (LeBonCoin / Amazon / Dealabs / etc.)
          <input value={url} onChange={(e)=>setUrl(e.target.value)} required />
        </label>

        <label>
          Image (URL)
          <input value={image} onChange={(e)=>setImage(e.target.value)} />
        </label>

        <label>
          Prix (optionnel)
          <input value={price} onChange={(e)=>setPrice(e.target.value)} />
        </label>

        <button type="submit" className="btn">Publier</button>
      </form>

      <style jsx>{`
        .pwrap{
          min-height:100vh;
          background:#07090f;
          color:#e9ecf5;
          padding:18px 14px 80px;
          font-family:system-ui;
        }
        h1{margin:0 0 14px;font-size:22px;font-weight:800;}
        .form{display:grid;gap:12px;}
        label{display:grid;gap:6px;font-size:13px;color:#aeb6cc;}
        input{
          padding:12px;border-radius:12px;
          border:1px solid #1b2440;background:#0f1422;color:#fff;
          outline:none;
        }
        .btn{
          margin-top:6px;
          padding:12px;border-radius:12px;font-weight:800;
          background:#112449;border:1px solid #27406f;color:#e7f0ff;
        }
      `}</style>
    </div>
  );
}
