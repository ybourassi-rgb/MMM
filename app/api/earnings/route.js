// app/api/earnings/route.js
import { NextResponse } from "next/server";

const UP_URL = process.env.UPSTASH_REST_URL;
const UP_TOKEN = process.env.UPSTASH_REST_TOKEN;

const KEY = "click_logs";

async function upstash(cmd, args = []) {
  const res = await fetch(
    `${UP_URL}/${cmd}/${args.map(encodeURIComponent).join("/")}`,
    {
      headers: { Authorization: `Bearer ${UP_TOKEN}` },
      cache: "no-store",
    }
  );
  const data = await res.json();
  return data.result;
}

// EPC estimés (modifiable dans .env)
const EPC_AMAZON = Number(process.env.EPC_AMAZON || 0.03);
const EPC_ALIEXPRESS = Number(process.env.EPC_ALIEXPRESS || 0.02);
const EPC_OTHER = Number(process.env.EPC_OTHER || 0.01);

function guessNetwork(domain = "") {
  const d = domain.toLowerCase();
  if (d.includes("amazon.")) return "amazon";
  if (d.includes("aliexpress.")) return "aliexpress";
  return "other";
}

export async function GET() {
  try {
    if (!UP_URL || !UP_TOKEN) {
      return NextResponse.json({
        ok: true,
        totalClicks: 0,
        byNetwork: [],
        topDeals: [],
        estimated: 0,
      });
    }

    const raw = await upstash("LRANGE", [KEY, 0, 2000]);
    const logs = (raw || [])
      .map((x) => {
        try { return JSON.parse(x); } catch { return null; }
      })
      .filter(Boolean);

    const byNetworkMap = { amazon: 0, aliexpress: 0, other: 0 };
    const byDealMap = {}; // key = title||url

    for (const l of logs) {
      const network = guessNetwork(l.domain);
      byNetworkMap[network]++;

      const dealKey = l.title || l.url || "deal-inconnu";
      if (!byDealMap[dealKey]) {
        byDealMap[dealKey] = {
          title: l.title || "Deal",
          url: l.url || null,
          domain: l.domain || null,
          count: 0,
          network,
        };
      }
      byDealMap[dealKey].count++;
    }

    const byNetwork = Object.entries(byNetworkMap).map(([network, count]) => {
      const epc =
        network === "amazon" ? EPC_AMAZON :
        network === "aliexpress" ? EPC_ALIEXPRESS :
        EPC_OTHER;

      return {
        network,
        count,
        epc,
        estimated: count * epc,
      };
    });

    const topDeals = Object.values(byDealMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 30)
      .map((d) => {
        const epc =
          d.network === "amazon" ? EPC_AMAZON :
          d.network === "aliexpress" ? EPC_ALIEXPRESS :
          EPC_OTHER;

        return {
          ...d,
          estimated: d.count * epc,
        };
      });

    const estimated = byNetwork.reduce((s, x) => s + x.estimated, 0);

    return NextResponse.json({
      ok: true,
      totalClicks: logs.length,
      byNetwork,
      topDeals,
      estimated,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Earnings error" },
      { status: 500 }
    );
  }
}
