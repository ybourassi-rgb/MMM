import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_KEY });

export default async function classify(text: string) {
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content:
          "Classe ce contenu dans UNE seule catégorie parmi : auto, immo, crypto, finance, business, autre. Réponds uniquement par le nom de la catégorie.\n\n" +
          text,
      },
    ],
  });

  const raw = res.choices[0].message.content || "";
  return raw.trim().toLowerCase();
}
