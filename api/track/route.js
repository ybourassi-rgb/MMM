import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");
  const product = searchParams.get("product");
  const redirect = searchParams.get("redirect");

  if (!platform || !product || !redirect) {
    return new Response(
      JSON.stringify({ error: "Missing parameters" }),
      { status: 400 }
    );
  }

  // Compter le clic (+1)
  await redis.hincrby("affiliate_clicks", `${platform}:${product}`, 1);

  // Rediriger vers Amazon ou AliExpress
  return Response.redirect(redirect, 302);
}
