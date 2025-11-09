import { runCycle } from "./affiliator_core.js";

export default async function handler(req, res) {
  const secret = req.query.secret;
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  try {
    const result = await runCycle();
    res.status(200).json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
