import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  const { platform, product, redirect } = req.query;

  // Vérification des paramètres
  if (!platform || !product || !redirect) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  // Incrémenter le compteur de clics dans Upstash
  await redis.hincrby("affiliate_clicks", `${platform}:${product}`, 1);

  // Rediriger vers Amazon / AliExpress / autre
  return res.redirect(302, redirect);
}
