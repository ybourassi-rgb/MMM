// MMM V10.3 — Front connecté aux routes Vercel

const API_BASE = location.origin; // même domaine que la page

// Vérifie le statut IA
async function ping() {
  const res = await fetch(`${API_BASE}/api/status`, { cache: "no-store" });
  const data = await res.json();
  const badge = document.querySelector("#ia-badge");
  if (badge) badge.textContent = (data.ok ?? true) ? "En ligne ✅" : "Hors ligne ❌";
  return data;
}

// Conseil instantané (envoie une question à l’IA)
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

// Auto-ping + gestion du bouton
document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Statut IA ---
  const badge = document.querySelector("#ia-badge");
  if (badge) {
    ping().catch(() => { badge.textContent = "Hors ligne ❌"; });
    setInterval(() => ping().catch(() => { badge.textContent = "Hors ligne ❌"; }), 10000);
  }

  // --- 2. Conseil instantané ---
  const input = document.querySelector("#instant-prompt, #topic");
  const btn   = document.querySelector("#instant-btn, #btn-ask");
  const out   = document.querySelector("#instant-out, #advice");

  if (btn && out) {
    btn.addEventListener("click", async () => {
      const text = (input?.value || "").trim();
      if (!text) { out.textContent = "Écris une question d’abord."; return; }
      out.textContent = "⏳ Je réfléchis…";
      try {
        const rep = await quickAdvice(text);
        out.textContent = rep;
      } catch (e) {
        out.textContent = "❌ " + (e.message || "Erreur");
      }
    });
  }
});
