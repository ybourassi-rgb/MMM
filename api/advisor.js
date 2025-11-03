// /api/advisor.js
export default async function handler(req, res) {
  // CORS basique
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Méthode non autorisée" });
  }

  try {
    // 🔐 Clés côté serveur
    const OPENAI_KEY =
      process.env.OPENAI_API_KEY ||
      process.env.MoneyMotorY ||
      process.env.MMM_Vercel_Key ||
      process.env.MMM_Vercel_KEY;

    const SCRAPER_KEY = process.env.SCRAPER_API_KEY;

    if (!OPENAI_KEY) {
      return res.status(500).json({
        ok: false,
        error:
          "Clé API OpenAI manquante. Définis OPENAI_API_KEY (ou MoneyMotorY / MMM_Vercel_Key) dans Vercel.",
      });
    }

    const body = req.body || {};
    const raw = (body.prompt || body.text || "").trim();
    if (!raw) {
      return res
        .status(400)
        .json({ ok: false, error: "Prompt vide (aucun texte fourni)." });
    }

    // 🧵 1) On détecte des URLs dans le prompt
    const urlRegex =
      /(https?:\/\/[^\s)]+(?:leboncoin\.fr|lacentrale\.fr|autoscout24\.|avito\.|facebook\.com\/marketplace)[^\s)]*)/gi;
    const urls = Array.from(new Set((raw.match(urlRegex) || []).map(u => u.trim())));

    // 👁️ 2) On tente de scraper les pages (si SCRAPER_API_KEY est configurée)
    const scraped = [];
    if (urls.length && SCRAPER_KEY) {
      for (const url of urls) {
        try {
          const html = await fetchViaScraper(url, SCRAPER_KEY);
          scraped.push({ url, ok: true, html });
        } catch (e) {
          scraped.push({ url, ok: false, error: e.message || "Erreur scraper" });
        }
      }
    } else if (urls.length && !SCRAPER_KEY) {
      // Pas de scraper configuré
      for (const url of urls) {
        scraped.push({
          url,
          ok: false,
          error:
            "SCRAPER_API_KEY manquante (active-la dans Vercel pour lire la page).",
        });
      }
    }

    // 📝 3) On fabrique un contexte "compact" pour l'IA (extrait titre/prix/kilométrage si possible)
    const items = scraped.map(s => ({
      url: s.url,
      meta: s.ok ? quickExtract(s.html) : { error: s.error || "inconnu" },
      status: s.ok ? "ok" : "fail",
    }));

    // 🧠 4) Appel OpenAI — on envoie le prompt utilisateur + items scrapés
    const userQuestion = raw.replace(urlRegex, "").trim(); // on retire les liens de la question
    const systemPrompt =
      "Tu es Money Motor Muslim (Money Motor Y), conseiller stratégique et financier. " +
      "Tu donnes des réponses opérationnelles, structurées, concises et exploitables, en respectant l’éthique halal.";

    const contextForAI = buildContextForAI(items);

    const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.5,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content:
              (urls.length
                ? `Analyse ces annonces (métadonnées extraites + statut d’accès) puis réponds à ma question.\n` +
                  contextForAI +
                  `\n\nQuestion : ${userQuestion || "Donne ton évaluation"}`
                : raw),
          },
        ],
      }),
    });

    if (!openaiResp.ok) {
      const txt = await openaiResp.text();
      return res
        .status(openaiResp.status)
        .json({ ok: false, error: `Erreur API OpenAI: ${txt}` });
    }

    const data = await openaiResp.json();
    const answer =
      data?.choices?.[0]?.message?.content?.trim() ||
      "⚠️ Aucune réponse reçue de l’IA.";

    // 🧾 5) On renvoie la réponse + un petit récap technique
    return res.status(200).json({
      ok: true,
      reply: answer,
      debug: {
        urls,
        parsed: items,
        note:
          urls.length && !SCRAPER_KEY
            ? "Les liens ont été détectés mais non lus (SCRAPER_API_KEY absente)."
            : undefined,
      },
    });
  } catch (err) {
    console.error("advisor.js error:", err);
    return res.status(500).json({ ok: false, error: err.message || "Erreur serveur" });
  }
}

/* ---------- Helpers ---------- */

// Appelle ScraperAPI (ou équivalent) pour récupérer le HTML de façon “navigateur”
async function fetchViaScraper(url, key) {
  const target =
    "https://api.scraperapi.com/?" +
    new URLSearchParams({
      api_key: key,
      url,
      country_code: "fr", // utile pour sites FR
      render: "true", // rendu JS (headless browser)
      keep_headers: "true",
    }).toString();

  const r = await fetch(target, { method: "GET", cache: "no-store" });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Scraper ${r.status}: ${t?.slice(0, 200) || "?"}`);
  }
  return await r.text();
}

// Extraction très simple depuis le HTML (heuristiques)
function quickExtract(html = "") {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  const find = (re) => {
    const m = text.match(re);
    return m ? m[1] || m[0] : null;
  };

  // heuristiques FR
  const price =
    find(/(\d[\d\s]{2,}(?:€| eur))/i) ||
    find(/prix[:\s]*([\d\s]+(?:€| eur))/i);
  const km =
    find(/(\d[\d\s]{2,})\s?km/i) ||
    find(/kilom(é|e)trage[:\s]*([\d\s]{2,})/i);
  const year = find(/\b(20[01]\d|202[0-9]|201[0-9])\b/);
  const title =
    find(/titre[:\s]*([a-z0-9\- ]{10,80})/i) ||
    find(/(?:peugeot|renault|dacia|mercedes|audi|bmw|toyota|volkswagen)[^\n]{0,40}/i);

  return {
    title: title ? safeCapitalize(title) : null,
    price: price ? price.replace(/\s+/g, " ") : null,
    km: km ? km.replace(/\s+/g, " ") : null,
    year: year || null,
  };
}

function buildContextForAI(items = []) {
  if (!items.length) return "";
  let out = "### Tableau d'évaluation des annonces\n";
  out += "| URL | Titre | Année | Km | Prix | Statut |\n";
  out += "|---|---|---:|---:|---:|---|\n";
  for (const it of items) {
    const { url, status, meta } = it;
    const row = [
      url,
      meta?.title || "n/d",
      meta?.year || "n/d",
      meta?.km || "n/d",
      meta?.price || "n/d",
      status === "ok" ? "✅ lu" : `❌ ${meta?.error || "inaccessible"}`,
    ];
    out += `| ${row.join(" | ")} |\n`;
  }
  out +=
    "\nDonne ensuite un **verdict** (bonne affaire / neutre / trop chère), " +
    "les **risques**, la **fourchette de prix conseillée**, et **les prochaines actions** concrètes.\n";
  return out;
}

function safeCapitalize(s) {
  try {
    return s
      .split(" ")
      .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ")
      .trim();
  } catch {
    return s;
  }
}
