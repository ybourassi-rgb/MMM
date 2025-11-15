// MMM V10.4 — Statut IA + Conseiller + Affiliation Amazon

// Domaine fixe de ton backend MMM
const API_BASE = "https://mmm-omega-five.vercel.app";

// Ton tag Amazon (à adapter avec ton vrai tag)
const AMAZON_TAG = "moneymotory-21"; // exemple

// =============== STATUT IA / CONSEILLER ===============

// --- Vérifie le statut IA ---
async function ping() {
  const badge = document.querySelector("#ia-badge");
  if (!badge) return;

  try {
    const res = await fetch(`${API_BASE}/api/status`);
    const data = await res.json();
    if (data.ok) {
      badge.textContent = "En ligne ✅";
    } else {
      badge.textContent = "Hors ligne ❌";
    }
  } catch (err) {
    badge.textContent = "Hors ligne ❌";
  }
}

// --- Envoie une question à Money Motor Y ---
async function quickAdvice(topic = "") {
  const input = String(topic || "").trim();
  if (!input) return "⚠️ Saisis une question.";

  try {
    const res = await fetch(`${API_BASE}/api/advisor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: input }),
    });

    const data = await res.json();
    return data.reply || data.answer || "❌ Pas de réponse.";
  } catch {
    return "Erreur de connexion à l’IA ❌";
  }
}

// =============== AFFILIATION AMAZON ===============

// Extraction de l’ASIN depuis une URL Amazon
function extractAmazonASIN(rawUrl = "") {
  const url = String(rawUrl).trim();
  if (!url) return null;

  // Exemple d’URL : https://www.amazon.fr/xxx/dp/B09XYZ1234/...
  const match = url.match(/\/([A-Z0-9]{10})(?:[/?]|$)/i);
  if (!match) return null;

  return match[1].toUpperCase();
}

// Construit le lien affilié Amazon simple
function buildAmazonAffiliateUrl(asin) {
  if (!asin) return null;
  return `https://www.amazon.fr/dp/${asin}?tag=${encodeURIComponent(
    AMAZON_TAG
  )}`;
}

// Construit le lien tracké (passage par /api/track pour compter le clic)
function buildAmazonTrackedLink(rawUrl) {
  const asin = extractAmazonASIN(rawUrl);
  if (!asin) return { error: "ASIN introuvable dans l’URL Amazon." };

  const affiliateUrl = buildAmazonAffiliateUrl(asin);
  if (!affiliateUrl) return { error: "Impossible de créer le lien affilié." };

  const trackedUrl =
    `${API_BASE}/api/track?` +
    `platform=amazon` +
    `&product=${encodeURIComponent(asin)}` +
    `&redirect=${encodeURIComponent(affiliateUrl)}`;

  return { asin, affiliateUrl, trackedUrl };
}

// =============== INIT UI ===============

document.addEventListener("DOMContentLoaded", () => {
  // --- Statut IA ---
  ping();

  // --- Conseiller IA ---
  const btnAsk = document.querySelector("#btn-ask");
  const fieldTopic = document.querySelector("#topic");
  const outputAdvice = document.querySelector("#advice");

  if (btnAsk && fieldTopic && outputAdvice) {
    btnAsk.addEventListener("click", async () => {
      outputAdvice.textContent = "⏳ Money Motor Y réfléchit...";
      const rep = await quickAdvice(fieldTopic.value);
      outputAdvice.textContent = rep;
    });
  }

  // --- Affiliation Amazon ---
  const inputAmazon = document.querySelector("#amz-url");
  const btnAmzGen = document.querySelector("#btn-amz-gen");
  const outAmz = document.querySelector("#amz-result");
  const btnAmzCopy = document.querySelector("#amz-copy");

  if (btnAmzGen && inputAmazon && outAmz) {
    btnAmzGen.addEventListener("click", () => {
      outAmz.textContent = "";

      const rawUrl = inputAmazon.value.trim();
      if (!rawUrl) {
        outAmz.textContent = "⚠️ Colle une URL Amazon d’abord.";
        return;
      }

      const res = buildAmazonTrackedLink(rawUrl);
      if (res.error) {
        outAmz.textContent = "❌ " + res.error;
        return;
      }

      // Affichage du lien tracké
      outAmz.textContent = res.trackedUrl;
      outAmz.dataset.link = res.trackedUrl; // stocké pour le bouton Copier
    });
  }

  if (btnAmzCopy && outAmz) {
    btnAmzCopy.addEventListener("click", async () => {
      const link = outAmz.dataset.link || outAmz.textContent || "";
      if (!link) return;

      try {
        await navigator.clipboard.writeText(link.trim());
        btnAmzCopy.textContent = "Copié ✅";
        setTimeout(() => {
          btnAmzCopy.textContent = "Copier";
        }, 1500);
      } catch {
        btnAmzCopy.textContent = "Erreur copie ❌";
        setTimeout(() => {
          btnAmzCopy.textContent = "Copier";
        }, 1500);
      }
    });
  }
});
