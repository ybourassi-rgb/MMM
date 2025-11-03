// MMM V10.3 — Front minimal connecté aux routes Vercel

const API_BASE = location.origin; // même domaine que la page

// 1) Statut IA (pour l'indicateur "En ligne / Hors ligne")
export async function ping() {
  const res = await fetch(`${API_BASE}/api/status`, { cache: "no-store" });
  const data = await res.json();
  // si tu as un <span id="ia-badge"> dans la page, on le met à jour :
  const badge = document.querySelector("#ia-badge");
  if (badge) badge.textContent = (data.ok ?? true) ? "En ligne ✅" : "Hors ligne ❌";
  return data;
}

// 2) Conseil instantané (utilise /api/advisor)
export async function quickAdvice(topic = "") {
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

// 3) (Optionnel) Ex-emplacement: currencies() ; on laisse un stub si c'est utilisé ailleurs
export async function currencies() {
  return { ok: true, note: "stub" };
}

// Auto-ping au chargement + toutes les 10s si l’élément existe
document.addEventListener("DOMContentLoaded", () => {
  const badge = document.querySelector("#ia-badge");
  if (badge) {
    ping().catch(() => { badge.textContent = "Hors ligne ❌"; });
    setInterval(() => ping().catch(() => { badge.textContent = "Hors ligne ❌"; }), 10000);
  }

  // Wiring du bouton "Obtenir un conseil" si la page contient ces IDs
  const input = document.querySelector("#instant-prompt");
  const btn = document.querySelector("#instant-btn");
  const out = document.querySelector("#instant-out");
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
