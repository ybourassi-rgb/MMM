// ⬇️ Remplace TOUTE ta fonction j() par celle-ci
async function j(url, opts = {}, { retries = 3, timeoutMs = 8000, backoffMs = 600 } = {}) {
  let attempt = 0, lastErr;

  while (attempt <= retries) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const r = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(t);

      let data = null;
      try { data = await r.json(); } catch { /* pas de JSON */ }

      if (!r.ok) {
        // Pour les 4xx, on ne retente pas (erreur côté client)
        const msg = (data && (data.error || data.message)) || `HTTP ${r.status}`;
        if (r.status >= 400 && r.status < 500) throw new Error(msg);
        // 5xx: on retente
        lastErr = new Error(msg);
      } else {
        return data; // ✅ succès
      }
    } catch (e) {
      clearTimeout(t);
      // Abort/Network/Timeout → on retente (sauf dernier essai)
      lastErr = e.name === "AbortError" ? new Error("Timeout du serveur") : e;
    }

    // Retry si on n’a pas épuisé les tentatives
    attempt++;
    if (attempt <= retries) {
      await new Promise(res => setTimeout(res, backoffMs * attempt)); // backoff progressif
    }
  }

  // Échec après toutes les tentatives
  throw new Error(lastErr?.message || "Échec réseau");
}
