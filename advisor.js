import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  const prompt = req.body.prompt || "Bonjour";
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    res.status(200).json({ 
      status: "online",
      answer: completion.choices[0].message.content 
    });
  } catch (error) {
    res.status(500).json({ 
      status: "error", 
      message: "Erreur du serveur IA ❌", 
      details: error.message 
    });
  }
}
