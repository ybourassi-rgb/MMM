// MMM V10.3 — Client web connecté à l’API Vercel (Money Motor Y)

const API_BASE = "https://mmm-omega-five.vercel.app";🔥 URL fixe de ton site Vercel

// --- Vérifier le statut IA ---
async function ping() {
  try {
    const res = await fetch(`${API_BASE}/api/status`, { cache: "no-store" });
    if (!res.ok) throw new Error("Erreur HTTP " + res.status);
    const data = await res.json();
    const badge = document.querySelector("#ia-badge");
    if (badge) badge.textContent = (data.ok ?? true) ? "En ligne ✅" : "Hors ligne ❌";
    return data;
  } catch (err) {
    const badge = document.querySelector("#ia-badge");
    if (badge) badge.textContent = "Hors ligne ❌";
    console.error("Erreur ping:", err);
    return { ok: false, error: err.message };
  }
}

// --- Envoyer une question à Money Motor Y ---
async function quickAdvice(topic = "") {
  const prompt = String(topic || "").trim();
  if (!prompt) throw new Error("Prompt vide");
  const res = await fetch(`${API_BASE}/api/advisor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Erreur API");
  return data.reply || data.answer || "(réponse vide)";
}

// --- Lancer automatiquement au chargement ---
document.addEventListener("DOMContentLoaded", () => {
  const badge = document.querySelector("#ia-badge");
  if (badge) {
    ping();
    setInterval(() => ping(), 10000);
  }

  const input = document.querySelector("#topic");
  const btn = document.querySelector("#btn-ask");
  const out = document.querySelector("#advice");

  if (btn && input && out) {
    btn.addEventListener("click", async () => {
      const text = input.value.trim();
      if (!text) {
        out.textContent = "💬 Écris une question d’abord.";
        return;
      }
      out.textContent = "⏳ Money Motor Y réfléchit...";
      try {
        const rep = await quickAdvice(text);
        out.textContent = rep;
      } catch (e) {
        out.textContent = "❌ " + (e.message || "Erreur serveur");
      }
    });
  }
});
