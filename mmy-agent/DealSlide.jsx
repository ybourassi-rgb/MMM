"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

export default function DealSlide({ item, active }) {
  const {
    title = "Opportunité",
    image,
    price,
    score,
    city,
    category,
    margin,
    risk,
    horizon,
    url,
    link,          // <= Dealabs
    affiliateUrl,
    halal,
  } = item || {};

  // 1) On choisit le bon lien même si l’API renvoie "link"
  const finalUrl = useMemo(
    () => affiliateUrl || url || link || null,
    [affiliateUrl, url, link]
  );

  // 2) Gestion image cassée → fallback propre
  const [imgOk, setImgOk] = useState(true);
  const finalImage = imgOk ? image : null;

  const openLink = (l) => {
    if (!l) return;
    window.open(l, "_blank", "noopener,noreferrer");
  };

  const trackClick = async (domain) => {
    try {
      await fetch("/api/log-click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          title,
          score,
          category,
          url: finalUrl,
        }),
      });
    } catch (e) {
      console.error("track error", e);
    }
  };

  const onSee = async () => {
    if (!finalUrl) return;
    try {
      const domain = new URL(finalUrl).hostname;
      await trackClick(domain);
    } catch {}
    openLink(finalUrl);
  };

  const onAnalyze = () => {
    console.log("Analyze:", item);
    // Plus tard: ouvrir modal Y-Score
  };

  const onShare = async () => {
    const l = finalUrl || "";
    try {
      if (navigator.share) {
        await navigator.share({ title, text: title, url: l });
      } else {
        await navigator.clipboard.writeText(l);
        alert("Lien copié ✅");
      }
    } catch (e) {
      console.error("share error", e);
    }
  };

  const onFav = () => {
    console.log("Fav:", item);
    // Plus tard: save profil Upstash
  };

  return (
    <div className="deal-slide">
      {/* Media background */}
      <div className="deal-media">
        {finalImage ? (
          <Image
            src={finalImage}
            alt={title}
            fill
            priority={active}
            sizes="100vw"
            quality={90}
            onError={() => setImgOk(false)}
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div className="deal-media-fallback">
            {image ? "Image indisponible" : "PHOTO / MINI-VIDÉO"}
          </div>
        )}
        <div className="deal-gradient" />
      </div>

      {/* Top chips */}
      <div className="deal-top">
        {score != null && <div className="deal-chip">Y-Score {score}</div>}
        {category && <div className="deal-chip">{category}</div>}
        {city && <div className="deal-chip">{city}</div>}
        {halal != null && (
          <div className="deal-chip">{halal ? "Halal ✅" : "Non Halal ⚠️"}</div>
        )}
      </div>

      {/* Right actions */}
      <div className="deal-actions">
        <button className="action-btn" onClick={onFav}>
          ❤️<span>Favori</span>
        </button>
        <button className="action-btn" onClick={onShare}>
          📤<span>Partager</span>
        </button>
        <button className="action-btn" onClick={onAnalyze}>
          🧠<span>Analyse</span>
        </button>
        <button className="action-btn" onClick={onSee} disabled={!finalUrl}>
          🔗<span>Voir</span>
        </button>
      </div>

     
