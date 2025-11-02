// api/advisor.js
export default async function handler(req, res) {
  try {
    // Autoriser GET simple pour tester, et POST JSON pour la prod
    let prompt = "";
    if (req.method === "GET") {
      prompt = (req.query.prompt || "").toString().trim();
    } else if (req.method === "POST") {
      const body = (req.headers["content-type"] || "").includes("application/json")
        ? await (async () => { try { return await parseJson(req); } catch { return {}; } })()
        : {};
      prompt = (body.prompt || "").toString().trim();
    } else {
      return res.status(405).json({ error: "Méthode non autorisée" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY manquante côté serveur" });
    }
    if (!prompt) prompt = "Donne un court conseil financier bienveillant.";

    // Appel OpenAI (chat completions pour compatibilité large)
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Tu es Money Motor Y, un conseiller pragmatique, bref et concret." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(500).json({ error: "Erreur OpenAI", detail: text });
    }

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "Aucune réponse reçue.";
    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur", detail: String(err?.message || err) });
  }
}

// lecture fiable du JSON même en mobile/web
async function parseJson(req) {
  return await new Promise((resolve, reject) => {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => {
      try { resolve(JSON.parse(b || "{}")); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}
