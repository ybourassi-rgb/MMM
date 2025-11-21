// pages/scroll.js
import { useState } from "react";

const DEALS = [
  {
    id: "hd599",
    type: "amazon",
    title: "Sennheiser HD 599 – Casque audiophile ouvert",
    price: "≈ 100 €",
    rating: 4.4,
    reviews: 9000,
    score: 82,
    mediaType: "image",
    mediaUrl: "/images/hd599.jpg", // mets ton image ici
    affiliateUrl: "https://www.amazon.fr/dp/B07Q7S7247?tag=moneymotor21-21",
    tags: ["Audio", "Casque", "Amazon"]
  },
  {
    id: "tapis",
    type: "amazon",
    title: "Tapis de cuisson silicone antiadhésif (lot de 2)",
    price: "≈ 12 €",
    rating: 4.6,
    reviews: 4500,
    score: 78,
    mediaType: "image",
    mediaUrl: "/images/tapis.jpg",
    affiliateUrl: "https://www.amazon.fr/dp/B0725GYNG6?tag=moneymotor21-21",
    tags: ["Maison", "Cuisine", "Petit prix"]
  },
  {
    id: "clio4",
    type: "auto",
    title: "Clio 4 1.5 dCi 2018 – 110 000 km – Marrakech",
    price: "≈ 105 000 MAD",
    rating: null,
    reviews: null,
    score: 80,
    mediaType: "image",
    mediaUrl: "/images/clio4.jpg",
    affiliateUrl: "https://www.leboncoin.fr/voitures/",
    tags: ["Voiture", "Diesel", "Occasion"]
  }
];

function DealCard({ deal }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        maxWidth: "480px",
        margin: "0 auto",
        padding: "16px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        background: "#000",
        color: "#fff",
      }}
    >
      {/* Media */}
      <div
        style={{
          flexShrink: 0,
          overflow: "hidden",
          borderRadius: "16px",
          marginBottom: "12px",
          height: "55vh",
          background: "#111",
        }}
      >
        {deal.mediaType === "image" ? (
          <img
            src={deal.mediaUrl}
            alt={deal.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <video
            src={deal.mediaUrl}
            controls
            muted
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </div>

      <h2 style={{ fontSize: "1.3rem", marginBottom: "6px" }}>{deal.title}</h2>

      <div style={{ color: "#ccc", marginBottom: "8px", fontSize: ".9rem" }}>
        {deal.price && <b style={{ color: "#fff" }}>{deal.price}</b>}{" "}
        {deal.rating && (
          <> • ⭐ {deal.rating} ({deal.reviews} avis)</>
        )}
      </div>

      {/* TAGS */}
      <div style={{ marginBottom: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {deal.tags.map((tag) => (
          <span
            key={tag}
            style={{
              padding: "4px 10px",
              borderRadius: "999px",
              background: "#111",
              border: "1px solid #333",
              fontSize: ".75rem",
            }}
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* BUTTON */}
      <a
        href={deal.affiliateUrl}
        target="_blank"
        rel="noreferrer"
        style={{
          marginTop: "auto",
          padding: "12px",
          textAlign: "center",
          borderRadius: "999px",
          background: "linear-gradient(90deg, #00f5a0, #00d9ff, #ffb347)",
          fontWeight: "bold",
          color: "#000",
          textDecoration: "none",
        }}
      >
        👉 Voir l'affaire
      </a>

      <p style={{ fontSize: ".75rem", marginTop: "10px", color: "#777" }}>
        Certains liens sont affiliés.
      </p>
    </div>
  );
}

export default function ScrollPage() {
  const [index, setIndex] = useState(0);

  const deal = DEALS[index];
  const hasPrev = index > 0;
  const hasNext = index < DEALS.length - 1;

  return (
    <div style={{ background: "#000", minHeight: "100vh", position: "relative" }}>
      <DealCard deal={deal} />

      {/* Boutons navigation */}
      <div
        style={{
          position: "fixed",
          bottom: "16px",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: "12px",
        }}
      >
        <button
          onClick={() => setIndex(index - 1)}
          disabled={!hasPrev}
          style={{
            padding: "10px 14px",
            background: "#111",
            color: "#fff",
            borderRadius: "999px",
            border: "1px solid #333",
            opacity: hasPrev ? 1 : 0.3,
          }}
        >
          ⬆️
        </button>

        <button
          onClick={() => setIndex(index + 1)}
          disabled={!hasNext}
          style={{
            padding: "10px 14px",
            background: "#111",
            color: "#fff",
            borderRadius: "999px",
            border: "1px solid #333",
            opacity: hasNext ? 1 : 0.3,
          }}
        >
          ⬇️
        </button>
      </div>
    </div>
  );
}
