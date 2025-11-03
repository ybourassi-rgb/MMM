// MMM V10.3 — Version simplifiée et 100% compatible Vercel

const API_BASE = "https://mmm-omega-five.vercel.app"; // ✅ Ton domaine fixe

// --- Vérifie le statut IA ---
async function ping() {
  const badge = document.querySelector("#ia-badge");
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
      body: JSON.stringify({ prompt: input })
    });
    const data = await res.json();
    return data.reply || data.answer || "❌ Pas de réponse.";
  } catch {
    return "Erreur de connexion à l’IA ❌";
  }
}

// --- Initialisation au chargement ---
document.addEventListener("DOMContentLoaded", () => {
  ping(); // teste dès le chargement

  const btn = document.querySelector("#btn-ask");
  const field = document.querySelector("#topic");
  const output = document.querySelector("#advice");

  if (btn) {
    btn.addEventListener("click", async () => {
      output.textContent = "⏳ Money Motor Y réfléchit...";
      const rep = await quickAdvice(field.value);
      output.textContent = rep;
    });
  }
});
