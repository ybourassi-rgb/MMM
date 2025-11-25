import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_, { params }) {
  try {
    const id = params.id;
    const auction = await redis.get(`auction:${id}`);
    if (!auction) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    const bids = (await redis.lrange(`bids:${id}`, 0, 50)) || [];
    return NextResponse.json({ ok: true, auction, bids });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  }
}
