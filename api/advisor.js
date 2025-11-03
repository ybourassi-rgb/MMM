// api/advisor.js
export default async function handler(req, res) {
  // CORS basique
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Méthode non autorisée" });
  }

  // ---- Clé OpenAI depuis les vars d'env (aucun secret en dur)
  const OPENAI_KEY =
    process.env.OPENAI_API_KEY ||
    process.env.MoneyMotorY ||
    process.env.MMM_Vercel_Key;

  if (!OPENAI_KEY) {
    return res.status(500).json({
      ok: false,
      error:
        "Clé API OpenAI manquante. Défnis OPENAI_API_KEY (ou MoneyMotorY / MMM_Vercel_Key) dans Vercel → Settings → Environment Variables.",
    });
  }

  // ---- Lecture prompt
  const { prompt } = req.body || {};
  const text = (prompt || "").trim();
  if (!text) {
    return res
      .status(400)
      .json({ ok: false, error: "Prompt vide (aucun texte fourni)." });
  }

  // ---- Détection d'URLs dans le prompt
  const urlRegex =
    /\bhttps?:\/\/[^\s)>\]}]+/gi; // basique mais robuste pour http/https
  const urls = (text.match(urlRegex) || []).slice(0, 5); // sécurité : max 5 liens

  // ---- Télécharge et nettoie chaque URL (HTML -> texte)
  async function fetchUrlText(u) {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 10_000); // 10s
    try {
      const r = await fetch(u, {
        redirect: "follow",
        signal: ctrl.signal,
        headers: {
          // certains sites bloquent sans UA
          "User-Agent":
            "Mozilla/5.0 (compatible; MMMBot/1.0; +https://mmm-omega-five.vercel.app)",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      clearTimeout(timeout);

      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const ctype = r.headers.get("content-type") || "";
      if (!ctype.includes("text/html") && !ctype.includes("text/plain")) {
        return { url: u, ok: false, note: `Type non supporté: ${ctype}` };
      }

      const raw = await r.text();

      // Nettoyage très simple HTML->texte
      let txt = raw
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      // borne pour éviter d’exploser le contexte (≈ ~8000 chars)
      const MAX = 8000;
      if (txt.length > MAX) txt = txt.slice(0, MAX) + "… [tronqué]";

      return { url: u, ok: true, text: txt };
    } catch (e) {
      clearTimeout(timeout);
      return { url: u, ok: false, note: `Fetch échoué: ${e.message}` };
    }
  }

  let crawls = [];
  if (urls.length) {
    const results = await Promise.all(urls.map(fetchUrlText));
    crawls = results.filter((r) => r.ok);
  }

  // ---- Construit le contexte pour l'IA
  const sourcesBlock =
    crawls.length > 0
      ? "\n\n[SOURCES]\n" +
        crawls
          .map(
            (c, i) =>
              `#${i + 1} ${c.url}\n---\n${c.text}\n---\n`
          )
          .join("\n")
      : "";

  // ---- Appel OpenAI
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content:
              "Tu es Money Motor Muslim (Money Motor Y), un conseiller stratégique & financier halal-friendly. " +
              "Quand des liens sont fournis, lis le contexte extrait des pages (section [SOURCES]) et produis une réponse courte, " +
              "très concrète et actionnable, avec puces et étapes. Cite les #sources utilisées en fin de réponse.",
          },
          {
            role: "user",
            content:
              urls.length
                ? `Question: ${text}\n${sourcesBlock}`
                : text,
          },
        ],
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      return res
        .status(r.status)
        .json({ ok: false, error: `Erreur API OpenAI: ${err}` });
    }

    const data = await r.json();
    const answer =
      data?.choices?.[0]?.message?.content?.trim() ||
      "⚠️ Aucune réponse reçue.";

    res.status(200).json({
      ok: true,
      reply: answer,
      usedLinks: urls,
      fetched: crawls.map((c) => c.url),
    });
  } catch (e) {
    res
      .status(500)
      .json({ ok: false, error: e.message || "Erreur interne serveur" });
  }
}
