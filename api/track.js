import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  const { platform, product, redirect } = req.query;

  if (!platform || !product || !redirect) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  await redis.hincrby("affiliate_clicks", `${platform}:${product}`, 1);

  return res.redirect(302, redirect);
}
