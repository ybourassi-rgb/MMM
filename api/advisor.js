// /api/advisor.js
export default async function handler(req, res) {
  // --- CORS basique ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Méthode non autorisée" });
  }

  try {
    // --- Clés d'env (toutes prises en charge) ---
    const OPENAI_KEY =
      process.env.OPENAI_API_KEY ||
      process.env.MoneyMotorY ||
      process.env.MMM_Vercel_Key ||
      process.env.MMM_Vercel_KEY;

    if (!OPENAI_KEY) {
      return res.status(500).json({
        ok: false,
        error:
          "Clé API OpenAI manquante. Définis OPENAI_API_KEY (ou MoneyMotorY / MMM_Vercel_Key) dans Vercel → Settings → Environment Variables.",
      });
    }

    // --- Lecture prompt ---
    const { prompt } = req.body || {};
    const text = (prompt || "").trim();
    if (!text) {
      return res
        .status(400)
        .json({ ok: false, error: "Prompt vide (aucun texte fourni)." });
    }

    // --- Détection de plusieurs URLs ---
    const urlRegex =
      /\bhttps?:\/\/[^\s)'"<>]+/gi; // simple mais robuste pour notre cas
    const urls = (text.match(urlRegex) || []).slice(0, 5); // jusqu’à 5 annonces

    // Helpers --------------------------------------------------------------
    const controllerWithTimeout = (ms) => {
      const ctrl = new AbortController();
      const id = setTimeout(() => ctrl.abort(), ms);
      return { signal: ctrl.signal, cancel: () => clearTimeout(id) };
    };

    const clamp = (s, max = 120_000) =>
      s.length > max ? s.slice(0, max) : s;

    function stripHtml(html) {
      // 1) remplace <script/style> par vide
      html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
      html = html.replace(/<style[\s\S]*?<\/style>/gi, "");
      // 2) récupère <title> et metas utiles
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : "";
      const ogTitle =
        (html.match(/property=["']og:title["'][^>]*content=["']([^"']+)/i) ||
          [])[1] || "";
      const ogDesc =
        (html.match(/property=["']og:description["'][^>]*content=["']([^"']+)/i) ||
          [])[1] || "";
      const metaDesc =
        (html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)/i) ||
          [])[1] || "";

      // 3) texte brut
      const body =
        html
          .replace(/<\/?[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim() || "";

      const head = [ogTitle, title, ogDesc || metaDesc].filter(Boolean).join(" • ");

      return `${head}\n\n${body}`;
    }

    function extractQuickFacts(raw) {
      // heuristiques rapides prix / km / année
      const facts = {};

      const priceMatch =
        raw.match(/(?:price|prix)[^0-9]{0,10}([\d\s.,]+)\s?(?:€|eur|dhs|mad)/i) ||
        raw.match(/([\d\s.,]+)\s?(?:€|eur|dhs|mad)\b/i);
      if (priceMatch) {
        facts.price = priceMatch[1].replace(/\s/g, "");
      }

      const kmMatch =
        raw.match(/([\d\s.,]+)\s?km\b/i) ||
        raw.match(/kilom(è|e)tres?[:\s]*([\d\s.,]+)/i);
      if (kmMatch) {
        const val = kmMatch[2] || kmMatch[1];
        facts.kilometers = val.replace(/\s/g, "");
      }

      const yearMatch = raw.match(/\b(20[0-4]\d|19[8-9]\d)\b/); // 1980–2049
      if (yearMatch) facts.year = yearMatch[1];

      return facts;
    }

    async function fetchPage(url) {
      try {
        const { signal, cancel } = controllerWithTimeout(10_000);
        const r = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; MMM-Advisor/1.0; +https://mmm)",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          signal,
        });
        cancel();
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const html = await r.text();
        const text = clamp(stripHtml(html), 120_000);
        const quick = extractQuickFacts(text.toLowerCase());
        return { ok: true, url, text, quick };
      } catch (e) {
        return { ok: false, url, error: e.message || "fetch failed" };
      }
    }

    // ----------------------------------------------------------------------

    let pages = [];
    if (urls.length) {
      pages = await Promise.all(urls.map(fetchPage));
    }

    // Construction du “contexte source” pour l’IA
    const sourcesForAi = pages.map((p, i) => {
      if (!p.ok) {
        return `# Source ${i + 1}\nURL: ${p.url}\nSTATUS: ERROR ${p.error}\n`;
      }
      const { price, kilometers, year } = p.quick || {};
      const header =
        `URL: ${p.url}\nExtracted: ` +
        `${price ? "price=" + price + " " : ""}` +
        `${kilometers ? "km=" + kilometers + " " : ""}` +
        `${year ? "year=" + year : ""}`;
      // garder un extrait lisible
      const snippet = p.text.slice(0, 4000);
      return `# Source ${i + 1}\n${header}\n\n${snippet}\n`;
    });

    // Demande envoyée au modèle
    const userGoal = urls.length
      ? `Analyse ces ${urls.length} annonces et dis-moi si ce sont de bonnes affaires.`
      : text;

    const systemPrompt =
      "Tu es Money Motor Muslim (Money Motor Y), un conseiller stratégique & financier.\n" +
      "Tu évalues des annonces auto (prix, km, année, état, modèle) et rends un verdict clair.\n" +
      "Quand plusieurs liens sont fournis, fais un tableau clair et un résumé opérationnel et halal-friendly.\n" +
      "Si une source est en erreur, ignore-la dans le verdict mais signale-la brièvement.";

    // Appel OpenAI
    async function callOpenAI(messages) {
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.4,
          messages,
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`Erreur API OpenAI: ${t}`);
      }
      const j = await r.json();
      return j?.choices?.[0]?.message?.content?.trim() || "";
    }

    let finalReply;
    if (urls.length) {
      const messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            `CONTEXTE SOURCES:\n\n${sourcesForAi.join(
              "\n\n"
            )}\n\nOBJECTIF:\n${userGoal}\n\n` +
            "FORMAT SOUHAITÉ:\n" +
            "1) Un tableau Markdown avec colonnes: URL | Modèle (si visible) | Année | Km | Prix | Estimation marché | Verdict (Bonne affaire / Trop chère) | Commentaire court\n" +
            "2) En dessous, un résumé en 5–7 points actionnables (quoi vérifier, négociation, pièges, budget, revente).\n" +
            "3) Si données manquantes, reste explicite (« n/d »).",
        },
      ];
      finalReply = await callOpenAI(messages);
    } else {
      // Pas de lien : mode conseil simple
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ];
      finalReply = await callOpenAI(messages);
    }

    return res.status(200).json({
      ok: true,
      reply: finalReply,
      urlsDetected: urls,
      pages: pages.map(({ ok, url, quick, error }) => ({ ok, url, quick, error })),
    });
  } catch (error) {
    console.error("advisor.js error:", error);
    return res.status(500).json({ ok: false, error: error.message || "Erreur interne" });
  }
}
