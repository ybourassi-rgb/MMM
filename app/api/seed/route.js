import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REST_TOKEN,
});

export async function GET() {
  const deal = {
    id: `seed-${Date.now()}`,
    title: "Deal test Amazon (casque/produit) ",
    url: "https://www.amazon.fr/dp/B07Q7S7247?tag=moneymotor21-21",
    affiliateUrl: "https://www.amazon.fr/dp/B07Q7S7247?tag=moneymotor21-21",
    category: "Auto",           // change si tu veux
    price: "à vérifier",
    score: 80,
    halal: true,
    city: "Marrakech",
    margin: "-",
    risk: "-",
    horizon: "-",
    image: null,
    ts: Date.now(),
    source: "manual-seed"
  };

  await redis.lpush("deals:all", JSON.stringify(deal));
  await redis.ltrim("deals:all", 0, 300);

  return Response.json({ ok: true, deal });
}
