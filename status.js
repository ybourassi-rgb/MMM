export default function handler(req, res) {
  res.status(200).json({ 
    status: "online", 
    message: "IA simulée opérationnelle ✅ (Serveur Vercel actif)" 
  });
}
