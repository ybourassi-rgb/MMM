import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = Date.now();

    // ids triés par fin proche
    const ids = await redis.zrange("auctions:live", 0, 80);
    if (!ids?.length) {
      return NextResponse.json({ ok: true, items: [] });
    }

    const items = [];
    for (const id of ids) {
      const auc = await redis.get(`auction:${id}`);
      if (!auc) continue;

      if (auc.status !== "live" || auc.endsAt <= now) {
        // cleanup
        await redis.zrem("auctions:live", id);
        continue;
      }

      items.push(auc);
    }

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    return NextResponse.json({ ok: false, items: [] }, { status: 500 });
  }
}
