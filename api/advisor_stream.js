// /api/advisor_stream.js
export const config = { runtime: "edge" };

function headers(contentType = "text/plain; charset=utf-8") {
  return {
    "Content-Type": contentType,
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    "CDN-Cache-Control": "no-store",
    "Vercel-CDN-Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: headers() });
  }
  if (req.method !== "POST") {
    return new Response("Méthode non autorisée", { status: 405, headers: headers() });
  }

  try {
    const OPENAI_KEY =
      process.env.OPENAI_API_KEY ||
      process.env.MoneyMotorY ||
      process.env.MMM_Vercel_Key;

    if (!OPENAI_KEY) {
      return new Response("Clé API OpenAI manquante.", { status: 500, headers: headers() });
    }

    let body = {};
    try { body = await req.json(); } catch {}
    const prompt = (body?.prompt || "").trim();
    if (!prompt) {
      return new Response("Prompt vide.", { status: 400, headers: headers() });
    }

    // ✅ Date FR du jour (ex: "mardi 11 novembre 2025")
    const todayFr = new Date().toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // ✅ Réponse directe si l’utilisateur demande explicitement la date/quel jour
    const askDateRe = /(on est quel jour|c'?est quel jour|quelle date|date actuelle|what (day|date) is it)/i;
    if (askDateRe.test(prompt)) {
      return new Response(`Aujourd’hui, nous sommes le ${todayFr}.`, {
        status: 200,
        headers: headers("text/plain; charset=utf-8"),
      });
    }

    // ✅ System prompt : autorise explicitement l’affichage de la date fournie
    const systemMsg = `
Tu es Money Motor Y, conseiller d’investissement.
Donne des réponses concises, chiffrées et actionnables : Verdict, Risques, Plan d’action.
IMPORTANT :
- La date exacte d’aujourd’hui est : ${todayFr}.
- Tu as le droit d’afficher cette date telle quelle.
- Si l’utilisateur demande la date du jour ou "on est quel jour", réponds explicitement :
  "Aujourd’hui, nous sommes le ${todayFr}."
- Ne dis jamais que tu ne peux pas fournir la date.
- Utilise toujours cette date pour contextualiser tes analyses si c’est pertinent.
`.trim();

    // Appel OpenAI en streaming (SSE)
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        stream: true,
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => "");
      return new Response(`Erreur OpenAI: ${errText}`, { status: 502, headers: headers() });
    }

    // Transforme le flux SSE OpenAI en texte pur, chunk par chunk
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      start(controller) {
        const reader = upstream.body.getReader();
        let buffer = "";

        function forward(text) {
          controller.enqueue(encoder.encode(text));
        }

        function onChunk(value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const ln of lines) {
            const line = ln.trim();
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const obj = JSON.parse(data);
              const delta = obj?.choices?.[0]?.delta?.content || "";
              if (delta) forward(delta);
            } catch {
              // ignore JSON parse errors for heartbeats
            }
          }
        }

        function pump() {
          reader.read().then(({ value, done }) => {
            if (done) {
              if (buffer) {
                forward(buffer);
                buffer = "";
              }
              controller.close();
              return;
            }
            onChunk(value);
            pump();
          }).catch(err => {
            controller.error(err);
          });
        }
        pump();
      }
    });

    return new Response(stream, { status: 200, headers: headers("text/plain; charset=utf-8") });
  } catch (e) {
    return new Response(String(e?.message || "Erreur interne"), { status: 500, headers: headers() });
  }
}
