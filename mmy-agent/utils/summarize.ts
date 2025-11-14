import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_KEY });

export default async function summarize(item: { content: string }) {
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `Résume ce contenu en 3 phrases maximales, utiles pour un investisseur (clarté, chiffres, impact potentiel):\n\n${item.content}`,
      },
    ],
  });

  return res.choices[0].message.content || "";
}
