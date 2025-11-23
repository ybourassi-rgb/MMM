"use client";
import Image from "next/image";

export default function DealSlide({ item, active }) {
  const {
    title,
    image,
    price,
    score,
    city,
    category,
    margin,
    risk,
    horizon,
  } = item;

  return (
    <div className="deal-slide">
      {/* Background image/video */}
      <div className="deal-media">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            priority={active}
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div className="deal-media-fallback">PHOTO / MINI-VIDÉO</div>
        )}
        <div className="deal-gradient" />
      </div>

      {/* Top chips */}
      <div className="deal-top">
        <div className="chip">Y-Score {score}</div>
        <div className="chip">{category}</div>
        <div className="chip">{city}</div>
      </div>

      {/* Right actions */}
      <div className="deal-actions">
        <button className="action-btn">❤️<span>Favori</span></button>
        <button className="action-btn">📤<span>Partager</span></button>
        <button className="action-btn">🧠<span>Analyse</span></button>
        <button className="action-btn">🔗<span>Voir</span></button>
      </div>

      {/* Bottom infos */}
      <div className="deal-bottom">
        <h2>{title}</h2>
        <p className="deal-price">Prix: {price}</p>

        <div className="deal-metrics">
          <div className="metric">
            <div className="metric-title">Marge</div>
            <div className="metric-value green">{margin}</div>
          </div>
          <div className="metric">
            <div className="metric-title">Risque</div>
            <div className="metric-value">{risk}</div>
          </div>
          <div className="metric">
            <div className="metric-title">Horizon</div>
            <div className="metric-value">{horizon}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
