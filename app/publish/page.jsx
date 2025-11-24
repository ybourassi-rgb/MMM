"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PublishPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [image, setImage] = useState("");        // ici on peut stocker dataURL
  const [imagePreview, setImagePreview] = useState(""); // preview
  const [category, setCategory] = useState("autre");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // compress image from phone
  // =========================
  const compressImage = (file, maxW = 1080, quality = 0.8) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          let { width, height } = img;
          if (width > maxW) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

  // =========================
  // handle file input
  // =========================
  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await compressImage(file);
      setImage(dataUrl);
      setImagePreview(dataUrl);
    } catch (err) {
      console.error(err);
      alert("Impossible de charger l'image");
    }
  };

  // =========================
  // submit
  // =========================
  const onSubmit = async (e) => {
    e.preventDefault();

    if (!title || !url) {
      return alert("Titre + lien obligatoires");
    }
    if (!image) {
      return alert("Image obligatoire (choisis une photo)");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          url,
          image,     // ✅ dataURL ou URL classique
          category,
          city,
        }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Erreur publish");

      alert("Deal publié ✅");
      router.push("/");
    } catch (err) {
      alert("Erreur: " + err.message);
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

        {/* ✅ Upload photo téléphone */}
        <label>
          Photo du deal * (obligatoire)
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onPickFile}
          />
        </label>

        {/* ✅ Preview */}
        {imagePreview && (
          <div className="preview">
            <img src={imagePreview} alt="preview" />
            <button
              type="button"
              className="remove"
              onClick={() => {
                setImage("");
                setImagePreview("");
              }}
            >
              Retirer l'image
            </button>
          </div>
        )}

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
          </select>
        </label>

        <label>
          Ville (optionnel)
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Paris, Marrakech..."
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

        .preview {
          margin-top: 4px;
          background: #0f1422;
          border: 1px solid #1b2440;
          border-radius: 12px;
          padding: 10px;
          display: grid;
          gap: 8px;
        }
        .preview img {
          width: 100%;
          height: auto;
          border-radius: 10px;
          object-fit: cover;
        }
        .remove {
          background: #241226;
          border: 1px solid #5a244f;
          color: #ffb3d9;
          padding: 8px;
          border-radius: 10px;
          font-weight: 700;
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
